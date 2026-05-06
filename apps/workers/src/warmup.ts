import { prisma } from '@residencia-med/db'
import { logger } from './logger'
import { filaIncidencia } from './queues'

/**
 * Garante que ha analise de incidencia para todas as bancas com pelo menos 1 questao.
 * Roda no boot dos workers — idempotente, barato.
 */
export async function warmupIncidencia(): Promise<void> {
  const bancas = await prisma.banca.findMany({
    where: { questoes: { some: { publicada: true } } },
    select: { id: true, codigo: true },
  })

  for (const banca of bancas) {
    await filaIncidencia.add(
      'recomputar-incidencia',
      { bancaId: banca.id },
      { jobId: `warmup:incidencia:${banca.id}`, attempts: 2 },
    )
  }

  logger.info({ bancas: bancas.length }, 'Warmup de incidencia enfileirado')
}
