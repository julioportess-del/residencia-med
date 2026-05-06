import { Worker } from 'bullmq'
import { prisma } from '@residencia-med/db'
import { gerarPlano, priorizarTemas } from '@residencia-med/core'
import { logger } from '../logger'
import { connection, FILA_PLANO, type JobGerarPlano } from '../queues'

export function iniciarWorkerPlano() {
  const worker = new Worker<JobGerarPlano>(
    FILA_PLANO,
    async (job) => {
      const { userId, motivo } = job.data
      const log = logger.child({ job: 'plano', userId, motivo })

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          dataProva: true,
          cargaHorariaSemanal: true,
          bancasAlvo: true,
          metaResidencia: true,
        },
      })
      if (!user || !user.dataProva || !user.cargaHorariaSemanal || !user.metaResidencia) {
        log.warn('Usuario sem onboarding completo, pulando')
        return
      }

      const banca = await prisma.banca.findUnique({ where: { codigo: user.metaResidencia } })
      if (!banca) {
        log.warn('Banca alvo nao encontrada, pulando')
        return
      }

      const analises = await prisma.analiseIncidencia.findMany({
        where: { bancaId: banca.id, janelaAnos: 10 },
        include: { tema: { select: { id: true, nome: true } } },
        orderBy: { porcentagem: 'desc' },
        take: 50,
      })

      const desempenho = await prisma.resposta.groupBy({
        by: ['questaoId'],
        where: { userId },
        _count: { _all: true },
      })
      // mapeamento simplificado — turno 3 vai relacionar respostas a temas via QuestaoTema
      const desempenhoPorTema = new Map<string, number>()
      void desempenho
      void desempenhoPorTema

      const temasRanqueados = priorizarTemas(
        analises.map((a) => ({
          temaId: a.temaId,
          porcentagemBanca: a.porcentagem,
          tendencia: a.tendencia,
          desempenhoUsuario: desempenhoPorTema.get(a.temaId) ?? null,
          nomeTema: a.tema.nome,
        })),
      )

      const blocos = gerarPlano(temasRanqueados, {
        cargaHorariaSemanal: user.cargaHorariaSemanal,
        dataProva: user.dataProva,
      })

      await prisma.$transaction(async (tx) => {
        const existente = await tx.planoEstudo.findUnique({ where: { userId } })
        if (existente) {
          await tx.blocoEstudo.deleteMany({
            where: { planoId: existente.id, status: 'PENDENTE' },
          })
          await tx.planoEstudo.update({
            where: { id: existente.id },
            data: { ultimaRevisaoEm: new Date() },
          })
          await tx.blocoEstudo.createMany({
            data: blocos.map((b) => ({
              planoId: existente.id,
              semana: b.semana,
              diaSemana: b.diaSemana,
              ordem: b.ordem,
              duracaoMin: b.duracaoMin,
              tipo: b.tipo,
              temaId: b.temaId,
              titulo: b.titulo,
              descricao: b.descricao,
            })),
          })
        } else {
          const plano = await tx.planoEstudo.create({
            data: {
              userId,
              bancaAlvo: user.metaResidencia ?? banca.codigo,
              dataProva: user.dataProva!,
              cargaHorariaSemanal: user.cargaHorariaSemanal!,
            },
          })
          await tx.blocoEstudo.createMany({
            data: blocos.map((b) => ({
              planoId: plano.id,
              semana: b.semana,
              diaSemana: b.diaSemana,
              ordem: b.ordem,
              duracaoMin: b.duracaoMin,
              tipo: b.tipo,
              temaId: b.temaId,
              titulo: b.titulo,
              descricao: b.descricao,
            })),
          })
        }
      })

      log.info({ blocos: blocos.length }, 'Plano gerado/atualizado')
    },
    { connection, concurrency: 5 },
  )

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Job de plano falhou')
  })

  return worker
}
