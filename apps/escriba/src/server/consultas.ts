import { prismaClinico } from '@residencia-med/db-clinico'

/** Lista as consultas nao-excluidas do medico, mais recentes primeiro. */
export async function listarConsultas(usuarioAuthId: string) {
  return prismaClinico.consulta.findMany({
    where: { usuarioAuthId, excluidoEm: null },
    orderBy: { criadoEm: 'desc' },
    include: {
      evolucoes: { select: { revisadoPeloMedico: true }, take: 1, orderBy: { criadoEm: 'desc' } },
    },
  })
}
