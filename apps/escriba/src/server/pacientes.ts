import { prismaClinico } from '@residencia-med/db-clinico'

export interface PacienteResumo {
  id: string
  nomeCompleto: string
  dataNascimento: Date | null
  telefone: string | null
  totalConsultas: number
}

export interface ConsultaVinculada {
  id: string
  pacienteIniciais: string
  tipoConsulta: string
  status: string
  atualizadoEm: Date
}

export interface PacienteDetalhe {
  id: string
  nomeCompleto: string
  dataNascimento: Date | null
  cpf: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  alergias: string[]
  medicamentos: string[]
  condicoesCronicas: string[]
  antecedentes: string | null
  consentimentoEm: Date | null
  consultas: ConsultaVinculada[]
}

/** Lista pacientes do médico (multi-tenant), com busca opcional por nome. */
export async function listarPacientes(
  usuarioAuthId: string,
  busca?: string,
): Promise<PacienteResumo[]> {
  const termo = busca?.trim()
  const pacientes = await prismaClinico.paciente.findMany({
    where: {
      usuarioAuthId,
      excluidoEm: null,
      ...(termo ? { nomeCompleto: { contains: termo, mode: 'insensitive' } } : {}),
    },
    orderBy: { nomeCompleto: 'asc' },
    take: 200,
    select: {
      id: true,
      nomeCompleto: true,
      dataNascimento: true,
      telefone: true,
      _count: { select: { consultas: true } },
    },
  })
  return pacientes.map((p) => ({
    id: p.id,
    nomeCompleto: p.nomeCompleto,
    dataNascimento: p.dataNascimento,
    telefone: p.telefone,
    totalConsultas: p._count.consultas,
  }))
}

/** Prontuário do paciente (multi-tenant) + histórico de consultas vinculadas. */
export async function obterPaciente(
  usuarioAuthId: string,
  id: string,
): Promise<PacienteDetalhe | null> {
  const p = await prismaClinico.paciente.findFirst({
    where: { id, usuarioAuthId, excluidoEm: null },
    include: {
      consultas: {
        where: { excluidoEm: null },
        orderBy: { atualizadoEm: 'desc' },
        select: {
          id: true,
          pacienteIniciais: true,
          tipoConsulta: true,
          status: true,
          atualizadoEm: true,
        },
      },
    },
  })
  if (!p) return null
  return {
    id: p.id,
    nomeCompleto: p.nomeCompleto,
    dataNascimento: p.dataNascimento,
    cpf: p.cpf,
    email: p.email,
    telefone: p.telefone,
    endereco: p.endereco,
    alergias: p.alergias,
    medicamentos: p.medicamentos,
    condicoesCronicas: p.condicoesCronicas,
    antecedentes: p.antecedentes,
    consentimentoEm: p.consentimentoEm,
    consultas: p.consultas.map((c) => ({
      id: c.id,
      pacienteIniciais: c.pacienteIniciais,
      tipoConsulta: c.tipoConsulta as string,
      status: c.status as string,
      atualizadoEm: c.atualizadoEm,
    })),
  }
}
