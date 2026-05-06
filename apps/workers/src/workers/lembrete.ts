import { Worker } from 'bullmq'
import { prisma } from '@residencia-med/db'
import { emailLembreteRevisao } from '@residencia-med/email'
import { logger } from '../logger'
import { connection, FILA_LEMBRETE, type JobLembrete } from '../queues'

/**
 * Lembrete diário: para cada usuário com itens de revisão vencidos hoje,
 * cria notificação in-app + dispara email transacional.
 *
 * Push web é disparado pelo helper criarNotificacao no apps/web — aqui
 * usamos só o Prisma direto pra evitar dependência circular.
 */
export function iniciarWorkerLembrete() {
  const worker = new Worker<JobLembrete>(
    FILA_LEMBRETE,
    async () => {
      const log = logger.child({ job: 'lembrete-diario' })
      const usuariosComItens = await prisma.user.findMany({
        where: {
          itensRevisao: {
            some: { proximaRevisao: { lte: new Date() } },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          _count: {
            select: {
              itensRevisao: { where: { proximaRevisao: { lte: new Date() } } },
            },
          },
        },
      })

      log.info({ usuarios: usuariosComItens.length }, 'usuários com revisões vencidas')

      let enviados = 0
      let erros = 0
      for (const u of usuariosComItens) {
        const qtd = u._count.itensRevisao
        if (qtd === 0) continue

        try {
          // Notificação in-app (sem dependência do helper criarNotificacao do
          // apps/web — workers usa Prisma direto)
          await prisma.notificacao.create({
            data: {
              userId: u.id,
              tipo: 'REVISAO_VENCENDO',
              titulo: `${qtd} ${qtd === 1 ? 'item' : 'itens'} para revisar hoje`,
              conteudo:
                'Revisar agora reforça a memória de longo prazo. 10 minutos hoje poupam horas.',
              link: '/revisao',
            },
          })

          // Email best-effort
          await emailLembreteRevisao(u.email, u.name, qtd)
          enviados++
        } catch (e) {
          erros++
          log.warn({ err: e, userId: u.id }, 'falha ao enviar lembrete')
        }
      }

      log.info({ enviados, erros }, 'lembrete diário concluído')
    },
    { connection, concurrency: 1 },
  )

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'job lembrete falhou')
  })

  return worker
}
