import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

export const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null })

export const FILA_REVISAO = 'revisao'
export const FILA_INCIDENCIA = 'incidencia'
export const FILA_PLANO = 'plano-estudo'

export const filaRevisao = new Queue(FILA_REVISAO, { connection })
export const filaIncidencia = new Queue(FILA_INCIDENCIA, { connection })
export const filaPlano = new Queue(FILA_PLANO, { connection })

export type JobAtualizarRevisao = {
  userId: string
  questaoId: string
  respostaId: string
}

export type JobRecomputarIncidencia = {
  bancaId: string
  janelas?: number[]
}

export type JobGerarPlano = {
  userId: string
  motivo: 'onboarding' | 'cron-semanal' | 'pos-respostas'
}
