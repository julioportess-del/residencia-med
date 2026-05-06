import { prisma } from '@residencia-med/db'
import { logger } from './logger'
import { filaIncidencia, filaLembrete, filaPlano } from './queues'

/**
 * Cron jobs configurados via BullMQ repeatable jobs (idempotente — sobrescreve se já existir).
 *
 * - Recomputar incidência: diário às 03:00 UTC, todas as bancas
 * - Regenerar plano: semanal aos domingos às 04:00 UTC, todos os usuários ativos
 *
 * Doc: docs/ROADMAP.md Turno 6
 */
export async function configurarCronJobs(): Promise<void> {
  // Daily incidence refresh
  await filaIncidencia.add(
    'cron-incidencia-diaria',
    { bancaId: 'TODAS' as never }, // marker — handler trata separadamente
    {
      repeat: { pattern: '0 3 * * *', tz: 'UTC' },
      jobId: 'cron-incidencia-diaria',
    },
  )

  // Weekly plan regen
  await filaPlano.add(
    'cron-plano-semanal',
    { userId: 'TODOS' as never, motivo: 'cron-semanal' },
    {
      repeat: { pattern: '0 4 * * 0', tz: 'UTC' },
      jobId: 'cron-plano-semanal',
    },
  )

  // Lembrete diário às 18:00 UTC (15:00 BRT em horário padrão)
  await filaLembrete.add(
    'cron-lembrete-diario',
    { ts: Date.now() },
    {
      repeat: { pattern: '0 18 * * *', tz: 'UTC' },
      jobId: 'cron-lembrete-diario',
    },
  )

  logger.info('Cron jobs configurados (incidência + plano + lembrete)')
}

/**
 * Quando o handler de incidência recebe `bancaId: 'TODAS'`, expande para todas as bancas.
 * Quando o handler de plano recebe `userId: 'TODOS'`, expande para todos os usuários
 * com onboarding completo.
 */
export async function expandirCronIncidencia(): Promise<void> {
  const bancas = await prisma.banca.findMany({
    where: { questoes: { some: { publicada: true } } },
    select: { id: true },
  })
  for (const banca of bancas) {
    await filaIncidencia.add(
      'recomputar-incidencia',
      { bancaId: banca.id },
      { jobId: `cron-expand:${Date.now()}:${banca.id}`, attempts: 2 },
    )
  }
  logger.info({ bancas: bancas.length }, 'Cron incidência expandida')
}

export async function expandirCronPlano(): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      metaResidencia: { not: null },
      dataProva: { not: null },
      cargaHorariaSemanal: { not: null },
    },
    select: { id: true },
  })
  for (const user of users) {
    await filaPlano.add(
      'gerar-plano',
      { userId: user.id, motivo: 'cron-semanal' },
      { jobId: `cron-plano:${Date.now()}:${user.id}`, attempts: 2 },
    )
  }
  logger.info({ users: users.length }, 'Cron plano semanal expandido')
}
