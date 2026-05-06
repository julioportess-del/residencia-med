import { Worker } from 'bullmq'
import { prisma } from '@residencia-med/db'
import { calcularIncidencia, calcularTendencia } from '@residencia-med/core'
import { logger } from '../logger'
import { connection, FILA_INCIDENCIA, type JobRecomputarIncidencia } from '../queues'
import { expandirCronIncidencia } from '../cron'

const JANELAS_DEFAULT = [5, 10]

export function iniciarWorkerIncidencia() {
  const worker = new Worker<JobRecomputarIncidencia>(
    FILA_INCIDENCIA,
    async (job) => {
      // Marker: cron diário expande para todas as bancas
      if (job.data.bancaId === 'TODAS') {
        await expandirCronIncidencia()
        return
      }

      const { bancaId, janelas = JANELAS_DEFAULT } = job.data
      const log = logger.child({ job: 'incidencia', bancaId })

      const questoes = await prisma.questao.findMany({
        where: { bancaId, publicada: true },
        select: {
          id: true,
          ano: true,
          temas: { select: { temaId: true, peso: true } },
        },
      })

      const questoesIncidencia = questoes.map((q) => ({
        questaoId: q.id,
        ano: q.ano,
        temas: q.temas.map((t) => ({ temaId: t.temaId, peso: t.peso })),
      }))

      const anoAtual = new Date().getFullYear()
      for (const janela of janelas) {
        const atual = calcularIncidencia(questoesIncidencia, anoAtual - janela, anoAtual)
        const anterior = calcularIncidencia(
          questoesIncidencia,
          anoAtual - janela * 2,
          anoAtual - janela - 1,
        )
        const tendencias = calcularTendencia(atual, anterior)

        await prisma.$transaction([
          prisma.analiseIncidencia.deleteMany({ where: { bancaId, janelaAnos: janela } }),
          prisma.analiseIncidencia.createMany({
            data: atual.map((i) => ({
              bancaId,
              temaId: i.temaId,
              janelaAnos: janela,
              totalQuestoes: i.totalQuestoes,
              porcentagem: i.porcentagem,
              tendencia: tendencias.get(i.temaId) ?? 0,
            })),
          }),
        ])

        log.info({ janela, temas: atual.length }, 'Analise de incidencia atualizada')
      }
    },
    { connection, concurrency: 2 },
  )

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Job de incidencia falhou')
  })

  return worker
}
