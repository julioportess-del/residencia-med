import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import {
  FILA_INCIDENCIA,
  FILA_PLANO,
  FILA_REVISAO,
  type JobAtualizarRevisao,
  type JobGerarPlano,
  type JobRecomputarIncidencia,
} from '@residencia-med/types'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

const globalForQueues = globalThis as unknown as {
  __queueConnection?: Redis
  __filaRevisao?: Queue<JobAtualizarRevisao>
  __filaIncidencia?: Queue<JobRecomputarIncidencia>
  __filaPlano?: Queue<JobGerarPlano>
}

function getConnection(): Redis {
  if (!globalForQueues.__queueConnection) {
    globalForQueues.__queueConnection = new Redis(REDIS_URL, { maxRetriesPerRequest: null })
  }
  return globalForQueues.__queueConnection
}

function getFilaRevisao(): Queue<JobAtualizarRevisao> {
  if (!globalForQueues.__filaRevisao) {
    globalForQueues.__filaRevisao = new Queue<JobAtualizarRevisao>(FILA_REVISAO, {
      connection: getConnection(),
    })
  }
  return globalForQueues.__filaRevisao
}

function getFilaIncidencia(): Queue<JobRecomputarIncidencia> {
  if (!globalForQueues.__filaIncidencia) {
    globalForQueues.__filaIncidencia = new Queue<JobRecomputarIncidencia>(FILA_INCIDENCIA, {
      connection: getConnection(),
    })
  }
  return globalForQueues.__filaIncidencia
}

function getFilaPlano(): Queue<JobGerarPlano> {
  if (!globalForQueues.__filaPlano) {
    globalForQueues.__filaPlano = new Queue<JobGerarPlano>(FILA_PLANO, {
      connection: getConnection(),
    })
  }
  return globalForQueues.__filaPlano
}

const opcoesPadrao = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 24 * 3600 },
}

export async function enqueueAtualizarRevisao(payload: JobAtualizarRevisao): Promise<void> {
  if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    return
  }
  try {
    await getFilaRevisao().add('atualizar-revisao', payload, {
      ...opcoesPadrao,
      jobId: `${payload.userId}:${payload.respostaId}`,
    })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[queues] Redis indisponivel, ignorando enqueue revisao', e)
    }
  }
}

export async function enqueueGerarPlano(payload: JobGerarPlano): Promise<void> {
  if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    return
  }
  try {
    await getFilaPlano().add('gerar-plano', payload, opcoesPadrao)
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[queues] Redis indisponivel, ignorando enqueue plano', e)
    }
  }
}

export async function enqueueRecomputarIncidencia(
  payload: JobRecomputarIncidencia,
): Promise<void> {
  try {
    await getFilaIncidencia().add('recomputar-incidencia', payload, {
      ...opcoesPadrao,
      jobId: `incidencia:${payload.bancaId}`,
    })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[queues] Redis indisponivel, ignorando enqueue incidencia', e)
    }
  }
}
