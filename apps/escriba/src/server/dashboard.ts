import { prismaClinico } from '@residencia-med/db-clinico'

export interface ItemConsultaResumo {
  id: string
  pacienteIniciais: string
  tipoConsulta: string
  status: string
  atualizadoEm: Date
}

export interface PacienteRecente {
  id: string
  nomeCompleto: string
  ultimaConsultaEm: Date | null
}

export interface ResumoDashboard {
  consultasHoje: ItemConsultaResumo[]
  emAndamento: ItemConsultaResumo[]
  pendentesRevisao: number
  filaRevisao: ItemConsultaResumo[]
  pacientesRecentes: PacienteRecente[]
}

function inicioDoDia(agora: Date): Date {
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
}

const SELECAO_RESUMO = {
  id: true,
  pacienteIniciais: true,
  tipoConsulta: true,
  status: true,
  atualizadoEm: true,
} as const

interface ConsultaResumoRaw {
  id: string
  pacienteIniciais: string
  tipoConsulta: string
  status: string
  atualizadoEm: Date
}

function paraResumo(c: ConsultaResumoRaw): ItemConsultaResumo {
  return {
    id: c.id,
    pacienteIniciais: c.pacienteIniciais,
    tipoConsulta: c.tipoConsulta as string,
    status: c.status as string,
    atualizadoEm: c.atualizadoEm,
  }
}

/**
 * Resumo do dia para o dashboard, priorizando ações clínicas:
 * atendimentos em andamento (retomada), consultas de hoje, fila de
 * revisão e pacientes recentes. Multi-tenant.
 */
export async function obterResumoDashboard(usuarioAuthId: string): Promise<ResumoDashboard> {
  const base = { usuarioAuthId, excluidoEm: null }
  const inicioHoje = inicioDoDia(new Date())

  const [consultasHoje, emAndamento, pendentesRevisao, filaRevisao, pacientesRecentes] =
    await Promise.all([
      prismaClinico.consulta.findMany({
        where: { ...base, criadoEm: { gte: inicioHoje } },
        orderBy: { criadoEm: 'desc' },
        take: 8,
        select: SELECAO_RESUMO,
      }),
      // Consultas interrompidas no meio do fluxo: gravação aberta ou
      // processamento — o médico precisa de um atalho de retomada.
      prismaClinico.consulta.findMany({
        where: { ...base, status: { in: ['GRAVANDO', 'TRANSCREVENDO', 'ESTRUTURANDO'] } },
        orderBy: { atualizadoEm: 'desc' },
        take: 3,
        select: SELECAO_RESUMO,
      }),
      prismaClinico.consulta.count({ where: { ...base, status: 'RASCUNHO' } }),
      prismaClinico.consulta.findMany({
        where: { ...base, status: 'RASCUNHO' },
        orderBy: { atualizadoEm: 'desc' },
        take: 5,
        select: SELECAO_RESUMO,
      }),
      prismaClinico.paciente.findMany({
        where: { usuarioAuthId, excluidoEm: null },
        orderBy: { atualizadoEm: 'desc' },
        take: 5,
        select: {
          id: true,
          nomeCompleto: true,
          consultas: {
            where: { excluidoEm: null },
            orderBy: { criadoEm: 'desc' },
            take: 1,
            select: { criadoEm: true },
          },
        },
      }),
    ])

  return {
    consultasHoje: consultasHoje.map(paraResumo),
    emAndamento: emAndamento.map(paraResumo),
    pendentesRevisao,
    filaRevisao: filaRevisao.map(paraResumo),
    pacientesRecentes: pacientesRecentes.map((p) => ({
      id: p.id,
      nomeCompleto: p.nomeCompleto,
      ultimaConsultaEm: p.consultas[0]?.criadoEm ?? null,
    })),
  }
}
