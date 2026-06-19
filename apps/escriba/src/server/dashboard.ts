import { prismaClinico } from '@residencia-med/db-clinico'

export interface ItemFilaRevisao {
  id: string
  pacienteIniciais: string
  tipoConsulta: string
  atualizadoEm: Date
}

export interface ResumoDashboard {
  consultasHoje: number
  pendentesRevisao: number
  filaRevisao: ItemFilaRevisao[]
}

function inicioDoDia(agora: Date): Date {
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
}

/**
 * Resumo do dia para o dashboard: consultas de hoje e fila de revisão
 * (rascunhos com evolução gerada, aguardando aprovação do médico). Multi-tenant.
 */
export async function obterResumoDashboard(usuarioAuthId: string): Promise<ResumoDashboard> {
  const base = { usuarioAuthId, excluidoEm: null }
  const inicioHoje = inicioDoDia(new Date())

  const [consultasHoje, pendentesRevisao, filaRevisao] = await Promise.all([
    prismaClinico.consulta.count({ where: { ...base, criadoEm: { gte: inicioHoje } } }),
    prismaClinico.consulta.count({ where: { ...base, status: 'RASCUNHO' } }),
    prismaClinico.consulta.findMany({
      where: { ...base, status: 'RASCUNHO' },
      orderBy: { atualizadoEm: 'desc' },
      take: 6,
      select: { id: true, pacienteIniciais: true, tipoConsulta: true, atualizadoEm: true },
    }),
  ])

  return {
    consultasHoje,
    pendentesRevisao,
    filaRevisao: filaRevisao.map((c) => ({
      id: c.id,
      pacienteIniciais: c.pacienteIniciais,
      tipoConsulta: c.tipoConsulta as string,
      atualizadoEm: c.atualizadoEm,
    })),
  }
}
