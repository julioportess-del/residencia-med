import { prismaClinico } from '@residencia-med/db-clinico'

export interface ModeloResumo {
  id: string
  nome: string
  especialidade: string | null
  tipoDocumento: string
  formatoBase: string
  isProprio: boolean
  isPadrao: boolean
  usosCount: number
  ultimoUsoEm: Date | null
}

export interface ModeloDetalhe extends ModeloResumo {
  instrucoes: string
}

interface FiltrosModelo {
  especialidade?: string
  tipo?: string
  q?: string
}

/** Modelos visíveis ao médico: os da plataforma (isPublico) + os próprios. */
export async function listarModelos(
  usuarioAuthId: string,
  filtros: FiltrosModelo = {},
): Promise<ModeloResumo[]> {
  const termo = filtros.q?.trim()
  const modelos = await prismaClinico.modelo.findMany({
    where: {
      excluidoEm: null,
      OR: [{ usuarioAuthId }, { isPublico: true }],
      ...(filtros.especialidade ? { especialidade: filtros.especialidade } : {}),
      ...(filtros.tipo ? { tipoDocumento: filtros.tipo as never } : {}),
      ...(termo ? { nome: { contains: termo, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ usosCount: 'desc' }, { nome: 'asc' }],
    take: 300,
    select: {
      id: true,
      nome: true,
      especialidade: true,
      tipoDocumento: true,
      formatoBase: true,
      usuarioAuthId: true,
      isPadrao: true,
      usosCount: true,
      ultimoUsoEm: true,
    },
  })
  return modelos.map((m) => ({
    id: m.id,
    nome: m.nome,
    especialidade: m.especialidade,
    tipoDocumento: m.tipoDocumento as string,
    formatoBase: m.formatoBase as string,
    isProprio: m.usuarioAuthId === usuarioAuthId,
    isPadrao: m.isPadrao,
    usosCount: m.usosCount,
    ultimoUsoEm: m.ultimoUsoEm,
  }))
}

/** Um modelo (próprio ou da plataforma) com as instruções completas. */
export async function obterModelo(
  usuarioAuthId: string,
  id: string,
): Promise<ModeloDetalhe | null> {
  const m = await prismaClinico.modelo.findFirst({
    where: { id, excluidoEm: null, OR: [{ usuarioAuthId }, { isPublico: true }] },
  })
  if (!m) return null
  return {
    id: m.id,
    nome: m.nome,
    especialidade: m.especialidade,
    tipoDocumento: m.tipoDocumento as string,
    formatoBase: m.formatoBase as string,
    isProprio: m.usuarioAuthId === usuarioAuthId,
    isPadrao: m.isPadrao,
    usosCount: m.usosCount,
    ultimoUsoEm: m.ultimoUsoEm,
    instrucoes: m.instrucoes,
  }
}

/** Contexto do modelo para injetar na estruturação (especialidade + instruções). */
export async function contextoDoModelo(
  usuarioAuthId: string,
  modeloId: string,
): Promise<{ especialidade: string | null; instrucoes: string } | null> {
  const m = await prismaClinico.modelo.findFirst({
    where: { id: modeloId, excluidoEm: null, OR: [{ usuarioAuthId }, { isPublico: true }] },
    select: { especialidade: true, instrucoes: true },
  })
  if (!m) return null
  return { especialidade: m.especialidade, instrucoes: m.instrucoes }
}
