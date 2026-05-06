import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY

export const anthropic = ANTHROPIC_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_KEY })
  : (null as never)

export const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : (null as never)

export const MODELO_ANTHROPIC = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
export const MODELO_EMBEDDING = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small'
