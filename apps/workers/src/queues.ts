import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import {
  FILA_INCIDENCIA,
  FILA_PLANO,
  FILA_REVISAO,
  type JobAtualizarRevisao,
  type JobGerarPlano,
  type JobRecomputarIncidencia,
} from '@residencia-med/types/queues'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

export const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null })

export { FILA_INCIDENCIA, FILA_PLANO, FILA_REVISAO }
export type { JobAtualizarRevisao, JobGerarPlano, JobRecomputarIncidencia }

export const FILA_LEMBRETE = 'lembrete-diario'
export type JobLembrete = { ts: number }

export const filaRevisao = new Queue<JobAtualizarRevisao>(FILA_REVISAO, { connection })
export const filaIncidencia = new Queue<JobRecomputarIncidencia>(FILA_INCIDENCIA, { connection })
export const filaPlano = new Queue<JobGerarPlano>(FILA_PLANO, { connection })
export const filaLembrete = new Queue<JobLembrete>(FILA_LEMBRETE, { connection })
