import { prismaClinico } from '@residencia-med/db-clinico'
import { estruturaClinicaSchema } from '@residencia-med/ai/clinico'

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
  tipoAtendimento: string
  status: string
  atualizadoEm: Date
  /** Mini-resumo derivado da evolução (queixa/hipóteses) para a linha do tempo. */
  resumo: string | null
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
          tipoAtendimento: true,
          status: true,
          atualizadoEm: true,
          // Estrutura clínica (só das mais recentes) p/ mini-resumo na timeline.
          evolucoes: { take: 1, select: { dadosEstruturados: true } },
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
    consultas: p.consultas.map((c, i) => ({
      id: c.id,
      pacienteIniciais: c.pacienteIniciais,
      tipoConsulta: c.tipoConsulta as string,
      tipoAtendimento: c.tipoAtendimento as string,
      status: c.status as string,
      atualizadoEm: c.atualizadoEm,
      // Limita o parse às 12 mais recentes (custo previsível).
      resumo: i < 12 ? miniResumo(c.evolucoes[0]?.dadosEstruturados) : null,
    })),
  }
}

/** Uma linha de resumo (queixa → hipóteses) a partir da estrutura persistida. */
function miniResumo(dados: unknown): string | null {
  const parse = estruturaClinicaSchema.safeParse(dados)
  if (!parse.success) return null
  const e = parse.data
  const partes = [
    e.subjetivo.queixaPrincipal,
    e.avaliacao.hipotesesDiagnosticas?.length
      ? e.avaliacao.hipotesesDiagnosticas.slice(0, 2).join('; ')
      : null,
  ].filter(Boolean)
  if (partes.length === 0) return null
  return partes.join(' → ').slice(0, 160)
}
