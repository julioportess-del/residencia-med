import { logger } from './logger'
import { warmupIncidencia } from './warmup'
import { configurarCronJobs } from './cron'
import { iniciarWorkerRevisao } from './workers/revisao'
import { iniciarWorkerIncidencia } from './workers/incidencia'
import { iniciarWorkerPlano } from './workers/plano'

async function main() {
  logger.info('Iniciando workers Residencia Med')

  iniciarWorkerRevisao()
  iniciarWorkerIncidencia()
  iniciarWorkerPlano()

  await warmupIncidencia()
  await configurarCronJobs()

  logger.info('Workers prontos com cron jobs configurados')
}

main().catch((err) => {
  logger.error({ err }, 'Falha fatal ao iniciar workers')
  process.exit(1)
})

process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido, encerrando')
  process.exit(0)
})
