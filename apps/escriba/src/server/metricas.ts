import { prismaClinico } from '@residencia-med/db-clinico'

/**
 * Estimativa conservadora de tempo de digitacao de prontuario poupado por
 * consulta processada. Referencia de mercado (voa.health) cita ~10 min; usamos
 * 8 min para nao superestimar. So conta consultas que geraram evolucao.
 */
const MINUTOS_ECONOMIZADOS_POR_CONSULTA = 8

const STATUS_PROCESSADO = ['RASCUNHO', 'REVISADO'] as const

export interface MetricasProdutividade {
  totalConsultas: number
  consultasProcessadas: number
  consultasRevisadas: number
  documentosGerados: number
  minutosEconomizados: number
  // Recorte do mes corrente
  consultasProcessadasMes: number
  minutosEconomizadosMes: number
  // Distribuicao por tipo (apenas processadas), ordenada desc
  porTipo: Array<{ tipo: string; total: number }>
}

function inicioDoMes(agora: Date): Date {
  return new Date(agora.getFullYear(), agora.getMonth(), 1)
}

/**
 * Agrega metricas de produtividade do medico a partir de Consulta e LogAcesso.
 * Multi-tenant: tudo filtrado por `usuarioAuthId`. Sem migration — calculado
 * em request path de pagina dedicada (volume pessoal e baixo).
 */
export async function obterMetricas(usuarioAuthId: string): Promise<MetricasProdutividade> {
  const base = { usuarioAuthId, excluidoEm: null }
  const processadas = { ...base, status: { in: [...STATUS_PROCESSADO] } }
  const inicioMes = inicioDoMes(new Date())

  const [
    totalConsultas,
    consultasProcessadas,
    consultasRevisadas,
    documentosGerados,
    consultasProcessadasMes,
    agrupadoPorTipo,
  ] = await Promise.all([
    prismaClinico.consulta.count({ where: base }),
    prismaClinico.consulta.count({ where: processadas }),
    prismaClinico.consulta.count({ where: { ...base, status: 'REVISADO' } }),
    prismaClinico.logAcesso.count({
      where: { usuarioAuthId, acao: { startsWith: 'GERAR_DOC_' } },
    }),
    prismaClinico.consulta.count({
      where: { ...processadas, criadoEm: { gte: inicioMes } },
    }),
    prismaClinico.consulta.groupBy({
      by: ['tipoConsulta'],
      where: processadas,
      _count: { _all: true },
    }),
  ])

  const porTipo = agrupadoPorTipo
    .map((g) => ({ tipo: g.tipoConsulta as string, total: g._count._all }))
    .sort((a, b) => b.total - a.total)

  return {
    totalConsultas,
    consultasProcessadas,
    consultasRevisadas,
    documentosGerados,
    minutosEconomizados: consultasProcessadas * MINUTOS_ECONOMIZADOS_POR_CONSULTA,
    consultasProcessadasMes,
    minutosEconomizadosMes: consultasProcessadasMes * MINUTOS_ECONOMIZADOS_POR_CONSULTA,
    porTipo,
  }
}

/** Formata minutos em "Xh Ymin" / "Ymin" para exibicao. */
export function formatarDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos}min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `${horas}h` : `${horas}h ${resto}min`
}
