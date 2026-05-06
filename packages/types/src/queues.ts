/**
 * Contratos de fila compartilhados entre web (enqueue) e workers (consume).
 * Doc: docs/ARCHITECTURE.md secao 5.
 */

export const FILA_REVISAO = 'revisao'
export const FILA_INCIDENCIA = 'incidencia'
export const FILA_PLANO = 'plano-estudo'

export type JobAtualizarRevisao = {
  userId: string
  questaoId: string
  respostaId: string
}

export type JobRecomputarIncidencia = {
  bancaId: string
  janelas?: number[]
}

export type JobGerarPlano = {
  userId: string
  motivo: 'onboarding' | 'cron-semanal' | 'pos-respostas'
}

export type FilaContratos = {
  [FILA_REVISAO]: JobAtualizarRevisao
  [FILA_INCIDENCIA]: JobRecomputarIncidencia
  [FILA_PLANO]: JobGerarPlano
}
