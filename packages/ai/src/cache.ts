import { createHash } from 'node:crypto'
import { Redis } from 'ioredis'

// Cache de LLM por hash do input. OPCIONAL: sem REDIS_URL (ex.: na Vercel),
// o cache fica desligado — sem tentar conectar, sem derrubar a função.
const REDIS_URL = process.env.REDIS_URL
const TTL_SEGUNDOS = 24 * 60 * 60

let redis: Redis | null = null
let cacheDesabilitado = !REDIS_URL

function getRedis(): Redis | null {
  if (cacheDesabilitado) return null
  if (!redis) {
    redis = new Redis(REDIS_URL as string, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      // Não ficar retentando indefinidamente (evita lentidão/loops).
      retryStrategy: () => null,
    })
    // CRÍTICO: sem este handler, um erro de conexão vira "unhandled error
    // event" e DERRUBA a função serverless. Ao primeiro erro, desliga o cache.
    redis.on('error', () => {
      cacheDesabilitado = true
    })
  }
  return redis
}

export function chaveCacheLLM(input: {
  funcao: string
  args: unknown
  modelo: string
  versaoPrompt: string
}): string {
  // Serialização canônica RECURSIVA. O replacer-array do JSON.stringify também
  // filtra objetos aninhados — ele zerava `args` e todas as chamadas colidiam.
  const canonical = JSON.stringify(ordenarChaves(input))
  return `llm:${createHash('sha256').update(canonical).digest('hex')}`
}

function ordenarChaves(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenarChaves)
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, ordenarChaves(v)]),
    )
  }
  return valor
}

export async function getCache<T>(chave: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null
  try {
    const valor = await client.get(chave)
    return valor ? (JSON.parse(valor) as T) : null
  } catch {
    return null
  }
}

export async function setCache<T>(
  chave: string,
  valor: T,
  ttl: number = TTL_SEGUNDOS,
): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    await client.setex(chave, ttl, JSON.stringify(valor))
  } catch {
    // cache best-effort
  }
}
