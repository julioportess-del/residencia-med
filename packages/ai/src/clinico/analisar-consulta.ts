import { z } from 'zod'
import { anthropic } from '../clients'
import { chaveCacheLLM, getCache, setCache } from '../cache'
import { buscarEvidencias, formatarEvidenciasParaPrompt, type Evidencia } from './evidencias'

/**
 * Escriba Clinical Copilot — análise clínica estruturada de uma consulta:
 * hipóteses com raciocínio (a favor/contra/faltante), sinais de alerta,
 * sugestão de tratamento e exames, ancorada em evidências REAIS buscadas
 * no PubMed/Europe PMC (as citações [n] referenciam a lista `fontes`
 * fornecida pelo Evidence Engine — o modelo não pode inventar referência).
 *
 * Tudo é SUGESTÃO de apoio à decisão: a conduta final é do médico.
 */

export const VERSAO_PROMPT_ANALISE = '2026-11-20.1'

const MODELO_ANALISE =
  process.env.ANALISE_MODEL ?? process.env.MODELO_ANTHROPIC ?? 'claude-sonnet-4-6'
const MODELO_TERMOS = process.env.ESTRUTURAR_MODEL ?? 'claude-haiku-4-5-20251001'
const TIMEOUT_MS = Number(process.env.ESTRUTURAR_TIMEOUT_MS ?? 45_000)

export const analiseClinicaSchema = z.object({
  resumoCaso: z.string().default(''),
  hipoteses: z
    .array(
      z.object({
        hipotese: z.string(),
        aFavor: z.array(z.string()).default([]),
        contra: z.array(z.string()).default([]),
        dadosFaltantes: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  sinaisAlerta: z.array(z.string()).default([]),
  tratamento: z
    .object({
      objetivo: z.string().default(''),
      preferenciais: z.array(z.string()).default([]),
      alternativas: z.array(z.string()).default([]),
      contraindicacoesInteracoes: z.array(z.string()).default([]),
      monitorizacao: z.array(z.string()).default([]),
    })
    .default({}),
  examesSugeridos: z
    .array(z.object({ exame: z.string(), justificativa: z.string().default('') }))
    .default([]),
  pendencias: z.array(z.string()).default([]),
  limitacoes: z.array(z.string()).default([]),
})

export type AnaliseClinica = z.infer<typeof analiseClinicaSchema>

export interface ResultadoAnalise {
  analise: AnaliseClinica
  fontes: Evidencia[]
}

export class AnaliseInvalidaError extends Error {
  constructor(motivo: string) {
    super(motivo)
    this.name = 'AnaliseInvalidaError'
  }
}

function extrairJson(texto: string): string {
  const inicio = texto.indexOf('{')
  if (inicio === -1) throw new AnaliseInvalidaError('resposta sem JSON')
  let prof = 0
  let emStr = false
  let esc = false
  for (let i = inicio; i < texto.length; i++) {
    const ch = texto[i]
    if (emStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') emStr = false
      continue
    }
    if (ch === '"') emStr = true
    else if (ch === '{') prof++
    else if (ch === '}') {
      prof--
      if (prof === 0) return texto.slice(inicio, i + 1)
    }
  }
  throw new AnaliseInvalidaError('JSON incompleto na resposta')
}

function textoDaResposta(resposta: { content: Array<{ type: string }> }): string {
  return resposta.content
    .map((b) => (b.type === 'text' ? (b as { type: string; text: string }).text : ''))
    .join('')
}

/**
 * Passo 1 — extrai a questão clínica e termos de busca DESIDENTIFICADOS
 * (inglês/MeSH) para o Evidence Engine. Nunca inclui dados do paciente.
 */
async function extrairTermosBusca(resumoClinico: string): Promise<string> {
  const resposta = await anthropic.messages.create(
    {
      model: MODELO_TERMOS,
      max_tokens: 200,
      system:
        'Voce extrai termos de busca bibliografica. Responda APENAS com uma linha curta de termos em INGLES (estilo PubMed/MeSH) que capture a principal questao clinica do caso (condicao + intervencao/diagnostico). NUNCA inclua nomes proprios ou dados identificaveis. Exemplo de saida: community acquired pneumonia adults treatment guideline',
      messages: [{ role: 'user', content: `Caso clinico (resumo):\n${resumoClinico}` }],
    },
    { timeout: 15_000, maxRetries: 0 },
  )
  return textoDaResposta(resposta).trim().replace(/\n+/g, ' ').slice(0, 200)
}

const SYSTEM_ANALISE = `Voce e um copiloto clinico para medicos brasileiros. Recebe a transcricao de uma consulta, o contexto clinico disponivel e uma LISTA NUMERADA DE EVIDENCIAS cientificas reais. Produza uma analise de apoio a decisao.

REGRAS CRITICAS:
- Voce APOIA a decisao; nao decide. Tudo e sugestao a ser validada pelo medico.
- Use SOMENTE as evidencias da lista para citar: referencie como [1], [2]... NUNCA cite estudo, diretriz ou numero que nao esteja na lista. Se a lista estiver vazia ou insuficiente, diga isso em "limitacoes" e fundamente apenas em raciocinio clinico declarado como tal.
- NAO invente dados do paciente: o que nao foi dito e "dado faltante", nunca suposicao.
- Distinga hipotese sugerida por voce de diagnostico afirmado pelo medico na consulta.
- Em tratamento, aponte contraindicacoes/interacoes RELEVANTES ao caso; se a lista de medicamentos do paciente for desconhecida, registre isso como pendencia (nunca afirme que nao ha interacoes).
- Exames: cada um com justificativa vinculada ao caso; nada indiscriminado.
- Responda APENAS com JSON valido, sem markdown, neste formato:
{
  "resumoCaso": string,
  "hipoteses": [{"hipotese": string, "aFavor": string[], "contra": string[], "dadosFaltantes": string[]}],
  "sinaisAlerta": string[],
  "tratamento": {"objetivo": string, "preferenciais": string[], "alternativas": string[], "contraindicacoesInteracoes": string[], "monitorizacao": string[]},
  "examesSugeridos": [{"exame": string, "justificativa": string}],
  "pendencias": string[],
  "limitacoes": string[]
}`

export interface EntradaAnalise {
  transcricao: string
  /** Contexto clínico desidentificado (listas de alergias/medicamentos etc.). */
  contextoClinico?: string
}

export async function analisarConsultaClinica(entrada: EntradaAnalise): Promise<ResultadoAnalise> {
  const transcricao = entrada.transcricao.trim()
  if (!transcricao) throw new AnaliseInvalidaError('transcricao vazia')

  const chave = chaveCacheLLM({
    funcao: 'analisarConsultaClinica',
    args: { transcricao, contexto: entrada.contextoClinico ?? null },
    modelo: MODELO_ANALISE,
    versaoPrompt: VERSAO_PROMPT_ANALISE,
  })
  const cacheado = await getCache<ResultadoAnalise>(chave)
  if (cacheado) return cacheado

  // 1) Questão de busca desidentificada → 2) Evidence Engine (falha ≠ bloqueio).
  let fontes: Evidencia[] = []
  try {
    const termos = await extrairTermosBusca(
      `${transcricao.slice(0, 1500)}\n${entrada.contextoClinico ?? ''}`,
    )
    if (termos) fontes = await buscarEvidencias(termos, 4)
  } catch {
    fontes = []
  }

  // 3) Análise principal com as evidências numeradas no contexto.
  const blocoEvidencias = formatarEvidenciasParaPrompt(fontes)
  const usuario = [
    entrada.contextoClinico ? `CONTEXTO CLINICO DISPONIVEL:\n${entrada.contextoClinico}` : null,
    blocoEvidencias
      ? `EVIDENCIAS DISPONIVEIS (cite apenas estas, como [n]):\n${blocoEvidencias}`
      : 'EVIDENCIAS DISPONIVEIS: nenhuma fonte foi recuperada — declare essa limitacao.',
    `TRANSCRICAO DA CONSULTA:\n<<<\n${transcricao}\n>>>`,
    'Produza o JSON da analise conforme as regras.',
  ]
    .filter(Boolean)
    .join('\n\n')

  const resposta = await anthropic.messages.create(
    {
      model: MODELO_ANALISE,
      max_tokens: 4096,
      system: SYSTEM_ANALISE,
      messages: [{ role: 'user', content: usuario }],
    },
    { timeout: TIMEOUT_MS, maxRetries: 0 },
  )
  if (resposta.stop_reason === 'max_tokens') {
    throw new AnaliseInvalidaError('A análise excedeu o limite de tamanho. Tente novamente.')
  }

  let parseado: unknown
  try {
    parseado = JSON.parse(extrairJson(textoDaResposta(resposta)))
  } catch (e) {
    if (e instanceof AnaliseInvalidaError) throw e
    throw new AnaliseInvalidaError('JSON malformado')
  }
  const validado = analiseClinicaSchema.safeParse(parseado)
  if (!validado.success) {
    throw new AnaliseInvalidaError(validado.error.issues[0]?.message ?? 'schema inválido')
  }

  const resultado: ResultadoAnalise = { analise: validado.data, fontes }
  await setCache(chave, resultado)
  return resultado
}
