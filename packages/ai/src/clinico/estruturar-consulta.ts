import { anthropic, MODELO_ANTHROPIC } from '../clients'
import { chaveCacheLLM, getCache, setCache } from '../cache'
import { estruturaClinicaSchema, type EstruturaClinica } from './tipos'
import {
  SYSTEM_ESTRUTURAR,
  VERSAO_PROMPT_ESTRUTURAR,
  montarMensagemUsuario,
} from './prompt-estruturar'

const MAX_TOKENS = 4096

export class EstruturacaoInvalidaError extends Error {
  constructor(detalhe: string) {
    super(`Nao foi possivel estruturar a consulta: ${detalhe}`)
    this.name = 'EstruturacaoInvalidaError'
  }
}

/**
 * Extrai o primeiro objeto JSON balanceado de um texto. Resiliente a
 * eventuais cercas de codigo ou texto extra que o modelo possa emitir,
 * apesar das instrucoes.
 */
function extrairJson(texto: string): string {
  const inicio = texto.indexOf('{')
  if (inicio === -1) throw new EstruturacaoInvalidaError('resposta sem JSON')

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
  throw new EstruturacaoInvalidaError('JSON incompleto na resposta')
}

/**
 * Estrutura a transcricao crua de uma consulta em EstruturaClinica (SOAP).
 * Filtra ruido social e mantem so o relevante. Resultado e cacheado por
 * hash da transcricao + versao do prompt.
 *
 * Saida e SUGESTAO de IA — exige revisao medica antes de virar prontuario.
 */
export interface ContextoEstruturacao {
  tipoConsulta?: string
  especialidade?: string
  instrucoesMedico?: string
}

export async function estruturarConsulta(
  transcricao: string,
  contexto?: ContextoEstruturacao,
): Promise<EstruturaClinica> {
  const textoLimpo = transcricao.trim()
  if (!textoLimpo) {
    throw new EstruturacaoInvalidaError('transcricao vazia')
  }

  const chave = chaveCacheLLM({
    funcao: 'estruturarConsulta',
    args: {
      transcricao: textoLimpo,
      tipoConsulta: contexto?.tipoConsulta ?? null,
      especialidade: contexto?.especialidade ?? null,
      instrucoesMedico: contexto?.instrucoesMedico ?? null,
    },
    modelo: MODELO_ANTHROPIC,
    versaoPrompt: VERSAO_PROMPT_ESTRUTURAR,
  })

  const cacheado = await getCache<EstruturaClinica>(chave)
  if (cacheado) return cacheado

  const resposta = await anthropic.messages.create({
    model: MODELO_ANTHROPIC,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_ESTRUTURAR,
    // Sem prefill de assistant: modelos novos (Claude 4+) nao aceitam prefill;
    // o SYSTEM_ESTRUTURAR ja instrui saida JSON e extrairJson isola o objeto.
    messages: [{ role: 'user', content: montarMensagemUsuario(textoLimpo, contexto) }],
  })

  const bruto = resposta.content.map((bloco) => (bloco.type === 'text' ? bloco.text : '')).join('')

  // Modelo retorna o JSON (eventualmente com texto ao redor); extrai o objeto.
  const jsonTexto = extrairJson(bruto)

  let parseado: unknown
  try {
    parseado = JSON.parse(jsonTexto)
  } catch {
    throw new EstruturacaoInvalidaError('JSON malformado')
  }

  const validado = estruturaClinicaSchema.safeParse(parseado)
  if (!validado.success) {
    throw new EstruturacaoInvalidaError(validado.error.issues[0]?.message ?? 'schema invalido')
  }

  await setCache(chave, validado.data)
  return validado.data
}
