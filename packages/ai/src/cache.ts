import { createHash } from 'node:crypto'
import { Redis } from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const TTL_SEGUNDOS = 24 * 60 * 60

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 })
  return redis
}

export function chaveCacheLLM(input: {
  funcao: string
  args: unknown
  modelo: string
  versaoPrompt: string
}): string {
  const canonical = JSON.stringify(input, Object.keys(input).sort())
  return `llm:${createHash('sha256').update(canonical).digest('hex')}`
}

export async function getCache<T>(chave: string): Promise<T | null> {
  try {
    const valor = await getRedis().get(chave)
    return valor ? (JSON.parse(valor) as T) : null
  } catch {
    return null
  }
}

export async function setCache<T>(chave: string, valor: T, ttl: number = TTL_SEGUNDOS): Promise<void> {
  try {
    await getRedis().setex(chave, ttl, JSON.stringify(valor))
  } catch {
    // cache best-effort
  }
}
