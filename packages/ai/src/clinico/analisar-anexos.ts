import type Anthropic from '@anthropic-ai/sdk'
import { anthropic, MODELO_ANTHROPIC } from '../clients'
import type { MensagemChat } from './assistente'

const MAX_TOKENS = 2200
const MAX_ANEXOS = 6
const MAX_CARACTERES_PERGUNTA = 4000

const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type MediaTypeImagem = (typeof TIPOS_IMAGEM)[number]

export class AnaliseAnexosInvalidaError extends Error {
  constructor(detalhe: string) {
    super(detalhe)
    this.name = 'AnaliseAnexosInvalidaError'
  }
}

/** Um anexo já baixado do Storage, pronto para virar bloco multimodal. */
export interface AnexoParaAnalise {
  nomeArquivo: string
  tipoMime: string // image/* ou application/pdf
  base64: string // conteúdo do arquivo (sem prefixo data:)
}

export interface EntradaAnaliseAnexos {
  pergunta: string
  anexos: AnexoParaAnalise[]
  historico?: MensagemChat[]
  /** Contexto opcional do médico (especialidade/instruções) — sem dado de paciente. */
  contexto?: string
}

const SYSTEM_ANALISE = `Você é um COPILOTO CLÍNICO multimodal para médicos brasileiros, com foco em Atenção Primária (UBS). O médico anexou exames e/ou imagens clínicas e fez uma pergunta. Seu papel é apoiar a decisão — nunca substituir o julgamento do médico.

Ao analisar os anexos, siga este raciocínio e organize a resposta nesta ordem (omita seções sem conteúdo aplicável):

1. RESUMO DO DOCUMENTO: extraia e liste de forma estruturada os dados relevantes (para exames laboratoriais, transcreva os valores em tabela com unidade e faixa de referência quando visível; para laudos de imagem, sintetize os principais achados descritos).
2. ALTERAÇÕES RELEVANTES: aponte o que está fora da referência ou clinicamente notável, com a magnitude do desvio.
3. CORRELAÇÃO COM A PERGUNTA: conecte os achados diretamente à dúvida do médico.
4. HIPÓTESES DIAGNÓSTICAS: liste diferenciais plausíveis, ordenados por probabilidade, justificando brevemente.
5. EXAMES COMPLEMENTARES: sugira a investigação adicional pertinente, quando aplicável.
6. CONDUTA: oriente conduta baseada em diretrizes reconhecidas (Ministério da Saúde, sociedades de especialidade), com posologia usual e ajustes (idade, gestação, função renal/hepática) quando couber.
7. SINAIS DE ALERTA E ENCAMINHAMENTO: destaque red flags e critérios de urgência/encaminhamento.
8. LIMITAÇÕES: se a imagem tiver baixa qualidade, o documento estiver incompleto/ilegível, ou os dados forem insuficientes, diga isso claramente e não invente valores nem referências.

REGRAS:
- Responda em português brasileiro, objetivo e prático para UBS/SUS. Use evidências; quando útil, indique força da recomendação/nível de evidência.
- Para imagens de lesões (dermatológicas, feridas, etc.): descreva morfologia e características relevantes, ofereça diferenciais e quando encaminhar — NUNCA dê diagnóstico definitivo só pela imagem.
- Não invente dados que não estão no documento. Se não conseguir ler algo, declare a limitação.
- Você fornece APOIO À DECISÃO, não prescrição nem laudo. A responsabilidade e o julgamento finais são do médico.
- Não registre nem solicite dados identificáveis do paciente.

Encerre com: "Apoio à decisão — confirme com a diretriz vigente e adapte ao paciente."`

function blocoDeAnexo(a: AnexoParaAnalise): Anthropic.ContentBlockParam {
  if (a.tipoMime === 'application/pdf') {
    return {
      type: 'document',
      title: a.nomeArquivo.slice(0, 100),
      source: { type: 'base64', media_type: 'application/pdf', data: a.base64 },
    }
  }
  if ((TIPOS_IMAGEM as readonly string[]).includes(a.tipoMime)) {
    return {
      type: 'image',
      source: { type: 'base64', media_type: a.tipoMime as MediaTypeImagem, data: a.base64 },
    }
  }
  throw new AnaliseAnexosInvalidaError(`Tipo de anexo não suportado: ${a.tipoMime}`)
}

/**
 * Análise multimodal de exames/imagens (EFÊMERA do ponto de vista da IA — nada
 * é retido pelo provedor além da resposta). Recebe os anexos já em base64, monta
 * blocos image/document e devolve a análise estruturada (texto).
 *
 * Saída é APOIO À DECISÃO — não substitui o julgamento do médico.
 */
export async function analisarAnexosClinicos(entrada: EntradaAnaliseAnexos): Promise<string> {
  const pergunta = (entrada.pergunta ?? '').trim().slice(0, MAX_CARACTERES_PERGUNTA)
  if (!pergunta) throw new AnaliseAnexosInvalidaError('Escreva uma pergunta sobre os anexos.')
  if (!Array.isArray(entrada.anexos) || entrada.anexos.length === 0) {
    throw new AnaliseAnexosInvalidaError('Nenhum anexo para analisar.')
  }
  if (entrada.anexos.length > MAX_ANEXOS) {
    throw new AnaliseAnexosInvalidaError(`Máximo de ${MAX_ANEXOS} anexos por análise.`)
  }

  const blocosAnexos = entrada.anexos.map(blocoDeAnexo)
  const textoPergunta = entrada.contexto
    ? `Contexto do médico: ${entrada.contexto}\n\nPergunta: ${pergunta}`
    : pergunta

  const conteudoUsuario: Anthropic.ContentBlockParam[] = [
    ...blocosAnexos,
    { type: 'text', text: textoPergunta },
  ]

  const historico: Anthropic.MessageParam[] = (entrada.historico ?? [])
    .filter((m) => (m.conteudo ?? '').trim().length > 0)
    .map((m) => ({ role: m.papel, content: m.conteudo.trim().slice(0, MAX_CARACTERES_PERGUNTA) }))

  const resposta = await anthropic.messages.create({
    model: MODELO_ANTHROPIC,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_ANALISE,
    messages: [...historico, { role: 'user', content: conteudoUsuario }],
  })

  const texto = resposta.content
    .map((bloco) => (bloco.type === 'text' ? bloco.text : ''))
    .join('')
    .trim()

  if (!texto) {
    throw new AnaliseAnexosInvalidaError('A análise não retornou resposta. Tente novamente.')
  }
  return texto
}
