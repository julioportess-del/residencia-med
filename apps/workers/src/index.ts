import { logger } from './logger'
import { iniciarWorkerRevisao } from './workers/revisao'
import { iniciarWorkerIncidencia } from './workers/incidencia'
import { iniciarWorkerPlano } from './workers/plano'

async function main() {
  logger.info('Iniciando workers Residencia Med')

  iniciarWorkerRevisao()
  iniciarWorkerIncidencia()
  iniciarWorkerPlano()

  logger.info('Workers prontos')
}

main().catch((err) => {
  logger.error({ err }, 'Falha fatal ao iniciar workers')
  process.exit(1)
})

process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido, encerrando')
  process.exit(0)
})
