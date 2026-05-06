import { Worker } from 'bullmq'
import { prisma } from '@residencia-med/db'
import { aplicarSM2 } from '@residencia-med/core'
import { logger } from '../logger'
import { connection, FILA_REVISAO, type JobAtualizarRevisao } from '../queues'

export function iniciarWorkerRevisao() {
  const worker = new Worker<JobAtualizarRevisao>(
    FILA_REVISAO,
    async (job) => {
      const { userId, questaoId, respostaId } = job.data
      const log = logger.child({ job: 'revisao', userId, questaoId, respostaId })

      const resposta = await prisma.resposta.findUnique({ where: { id: respostaId } })
      if (!resposta) {
        log.warn('Resposta nao encontrada, pulando')
        return
      }
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { dataProva: true },
      })
      const itemAtual = await prisma.itemRevisao.findUnique({
        where: { userId_questaoId: { userId, questaoId } },
      })

      const novo = aplicarSM2(
        itemAtual
          ? {
              intervalo: itemAtual.intervalo,
              repeticoes: itemAtual.repeticoes,
              fatorFacilidade: itemAtual.fatorFacilidade,
              qualidade: itemAtual.qualidade,
              ultimaRevisao: itemAtual.ultimaRevisao,
              proximaRevisao: itemAtual.proximaRevisao,
            }
          : null,
        {
          correta: resposta.correta,
          tempoSegundos: resposta.tempoSegundos,
          confianca: resposta.confianca ?? undefined,
        },
        { dataProva: user?.dataProva ?? null },
      )

      await prisma.itemRevisao.upsert({
        where: { userId_questaoId: { userId, questaoId } },
        create: {
          userId,
          questaoId,
          intervalo: novo.intervalo,
          repeticoes: novo.repeticoes,
          fatorFacilidade: novo.fatorFacilidade,
          qualidade: novo.qualidade,
          ultimaRevisao: novo.ultimaRevisao,
          proximaRevisao: novo.proximaRevisao,
        },
        update: {
          intervalo: novo.intervalo,
          repeticoes: novo.repeticoes,
          fatorFacilidade: novo.fatorFacilidade,
          qualidade: novo.qualidade,
          ultimaRevisao: novo.ultimaRevisao,
          proximaRevisao: novo.proximaRevisao,
        },
      })
      log.debug({ intervalo: novo.intervalo }, 'Item de revisao atualizado')
    },
    { connection, concurrency: 10 },
  )

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Job de revisao falhou')
  })

  return worker
}
