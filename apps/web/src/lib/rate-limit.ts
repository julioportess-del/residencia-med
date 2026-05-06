import { Redis } from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

const globalForRL = globalThis as unknown as { __redisRL?: Redis }

function getRedis(): Redis {
  if (!globalForRL.__redisRL) {
    globalForRL.__redisRL = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 })
  }
  return globalForRL.__redisRL
}

export type RateLimitInput = {
  chave: string
  limite: number
  janelaSegundos: number
}

export type RateLimitResult = {
  permitido: boolean
  restantes: number
  limite: number
}

/**
 * Sliding window rate limit via Redis ZSET.
 * Se Redis indisponivel, falha aberto (permite request) — observabilidade
 * detecta o problema sem derrubar usuarios.
 */
export async function rateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const redis = getRedis()
  const agora = Date.now()
  const limiteInferior = agora - input.janelaSegundos * 1000
  const chave = `rl:${input.chave}`

  try {
    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(chave, 0, limiteInferior)
    pipeline.zadd(chave, agora, `${agora}-${Math.random()}`)
    pipeline.zcard(chave)
    pipeline.expire(chave, input.janelaSegundos + 1)
    const results = await pipeline.exec()
    if (!results) return { permitido: true, restantes: input.limite, limite: input.limite }
    const total = (results[2]?.[1] as number) ?? 0
    return {
      permitido: total <= input.limite,
      restantes: Math.max(0, input.limite - total),
      limite: input.limite,
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[rate-limit] Redis indisponivel, fail-open', e)
    }
    return { permitido: true, restantes: input.limite, limite: input.limite }
  }
}
