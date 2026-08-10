import { z } from 'zod'
import { anthropic } from '../clients'
import { chaveCacheLLM, getCache, setCache } from '../cache'
import type { EstruturaClinica } from './tipos'

const MAX_TOKENS = 2048
// Mesmo racional da estruturacao: Haiku e rapido/barato e a saida e apoio, nao decisao.
const MODELO_REVISAR = process.env.REVISAR_MODEL ?? 'claude-haiku-4-5-20251001'
const TIMEOUT_MS = Number(process.env.ESTRUTURAR_TIMEOUT_MS ?? 50_000)
export const VERSAO_PROMPT_REVISAR = 'revisar-v1'

export const apontamentoRevisaoSchema = z.object({
  categoria: z.enum([
    'MEDICAMENTO_SEM_DOSE',
    'SINTOMA_SEM_DURACAO',
    'CONTRADICAO',
    'ALERGIA_NAO_REGISTRADA',
    'EXAME_SEM_RESULTADO',
    'DIAGNOSTICO_SEM_SUPORTE',
    'INFORMACAO_AUSENTE',
    'OUTRO',
  ]),
  descricao: z.string(),
  gravidade: z.enum(['ALTA', 'MEDIA', 'BAIXA']),
})

export const revisaoConsultaSchema = z.object({
  apontamentos: z.array(apontamentoRevisaoSchema).default([]),
})

export type ApontamentoRevisao = z.infer<typeof apontamentoRevisaoSchema>
export type RevisaoConsulta = z.infer<typeof revisaoConsultaSchema>

export class RevisaoInvalidaError extends Error {
  constructor(detalhe: string) {
    super(`Nao foi possivel revisar a consulta: ${detalhe}`)
    this.name = 'RevisaoInvalidaError'
  }
}

const SYSTEM_REVISAR = `Você é um auditor de QUALIDADE DE DOCUMENTAÇÃO CLÍNICA para médicos brasileiros de atenção primária. Você recebe a evolução estruturada de uma consulta (e a transcrição de origem) e aponta LACUNAS DE DOCUMENTAÇÃO — nunca julga a decisão médica.

O QUE PROCURAR (apenas problemas de REGISTRO):
- MEDICAMENTO_SEM_DOSE: prescrição/medicação citada sem dose, via, frequência ou duração.
- SINTOMA_SEM_DURACAO: queixa/sintoma relevante sem tempo de evolução registrado.
- CONTRADICAO: informações incompatíveis entre si no registro (ex.: "nega febre" e "febril").
- ALERGIA_NAO_REGISTRADA: menção a alergia/reação na transcrição que não consta na evolução.
- EXAME_SEM_RESULTADO: exame citado como avaliado mas sem resultado registrado.
- DIAGNOSTICO_SEM_SUPORTE: hipótese diagnóstica sem nenhum elemento clínico registrado que a sustente.
- INFORMACAO_AUSENTE: dado clinicamente relevante dito na transcrição que não foi para a evolução.

REGRAS:
- Aponte NO MÁXIMO 8 itens, os mais relevantes primeiro. Se a documentação estiver adequada, retorne lista vazia.
- Cada descrição: 1 frase objetiva, citando o item específico (ex.: "Losartana citada sem dose nem posologia").
- gravidade: ALTA (risco de segurança/legal — alergia, contradição, medicamento sem dose), MEDIA (lacuna clínica relevante), BAIXA (aperfeiçoamento).
- NÃO invente problemas. NÃO sugira condutas. NÃO avalie se o diagnóstico está certo — apenas se está documentado.

FORMATO DA RESPOSTA — APENAS este JSON, sem texto extra:
{"apontamentos":[{"categoria":"...","descricao":"...","gravidade":"ALTA|MEDIA|BAIXA"}]}`

function extrairJson(texto: string): string {
  const inicio = texto.indexOf('{')
  if (inicio === -1) throw new RevisaoInvalidaError('resposta sem JSON')
  let profundidade = 0
  let emString = false
  let escapado = false
  for (let i = inicio; i < texto.length; i++) {
    const ch = texto[i]
    if (emString) {
      if (escapado) escapado = false
      else if (ch === '\\') escapado = true
      else if (ch === '"') emString = false
      continue
    }
    if (ch === '"') emString = true
    else if (ch === '{') profundidade++
    else if (ch === '}') {
      profundidade--
      if (profundidade === 0) return texto.slice(inicio, i + 1)
    }
  }
  throw new RevisaoInvalidaError('JSON incompleto na resposta')
}

/**
 * Revisão inteligente de documentação: aponta lacunas de registro na
 * evolução gerada (medicamento sem dose, contradições, alergia não
 * registrada, etc.). Apoio à documentação — NUNCA substitui a decisão
 * médica. Cacheada por hash (estrutura + transcrição + versão do prompt).
 */
export async function revisarConsulta(entrada: {
  estrutura: EstruturaClinica
  transcricao: string
}): Promise<RevisaoConsulta> {
  const transcricao = entrada.transcricao.trim().slice(0, 60_000)
  const estruturaJson = JSON.stringify(entrada.estrutura)

  const chave = chaveCacheLLM({
    funcao: 'revisar-consulta',
    args: { estrutura: estruturaJson, transcricao },
    modelo: MODELO_REVISAR,
    versaoPrompt: VERSAO_PROMPT_REVISAR,
  })
  const cacheado = await getCache<RevisaoConsulta>(chave)
  if (cacheado) return cacheado

  const resposta = await anthropic.messages.create(
    {
      model: MODELO_REVISAR,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_REVISAR,
      messages: [
        {
          role: 'user',
          content: `EVOLUÇÃO ESTRUTURADA:\n${estruturaJson}\n\nTRANSCRIÇÃO DE ORIGEM:\n${transcricao}`,
        },
      ],
    },
    { timeout: TIMEOUT_MS, maxRetries: 0 },
  )

  const texto = resposta.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim()

  let bruto: unknown
  try {
    bruto = JSON.parse(extrairJson(texto))
  } catch (e) {
    if (e instanceof RevisaoInvalidaError) throw e
    throw new RevisaoInvalidaError('JSON malformado na resposta')
  }

  const parse = revisaoConsultaSchema.safeParse(bruto)
  if (!parse.success) {
    throw new RevisaoInvalidaError('estrutura de resposta inesperada')
  }

  await setCache(chave, parse.data)
  return parse.data
}
