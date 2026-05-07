import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY

export const ANTHROPIC_HABILITADO = Boolean(ANTHROPIC_KEY)
export const OPENAI_HABILITADO = Boolean(OPENAI_KEY)

class IAIndisponivelError extends Error {
  constructor(provedor: 'Anthropic' | 'OpenAI') {
    super(
      `${provedor} não configurado. Defina ${
        provedor === 'Anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'
      } no .env para habilitar IA.`,
    )
    this.name = 'IAIndisponivelError'
  }
}

/**
 * Proxy que devolve o cliente real quando a chave está configurada e levanta
 * IAIndisponivelError quando não está. Permite imports seguros mesmo em modo dev
 * sem chave — o erro só aparece quando alguém tenta usar.
 */
function clienteProxy<T extends object>(real: T | null, provedor: 'Anthropic' | 'OpenAI'): T {
  return new Proxy({} as T, {
    get(_, prop) {
      if (!real) throw new IAIndisponivelError(provedor)
      const v = (real as Record<string | symbol, unknown>)[prop]
      return typeof v === 'function' ? v.bind(real) : v
    },
  })
}

export const anthropic = clienteProxy(
  ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null,
  'Anthropic',
)

export const openai = clienteProxy(
  OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null,
  'OpenAI',
)

export const MODELO_ANTHROPIC = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
export const MODELO_EMBEDDING = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small'
