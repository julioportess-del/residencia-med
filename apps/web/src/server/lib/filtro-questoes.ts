import { restricaoPorSituacao, resumirHistorico, type SituacaoQuestao } from '@residencia-med/core'
import type { Prisma, PrismaClient } from '@residencia-med/db'
import type { FiltrosBanco } from '@residencia-med/types'

/**
 * Traduz os filtros combinados do banco de questões em `where` do Prisma.
 * A situação (inédita, errada, chute…) é calculada a partir do histórico do
 * próprio usuário — sempre filtrado por userId.
 */
export async function montarWhereQuestoes(
  prisma: PrismaClient,
  userId: string,
  filtros: Partial<FiltrosBanco>,
): Promise<Prisma.QuestaoWhereInput> {
  const situacao: SituacaoQuestao = filtros.situacao ?? 'TODAS'
  const termo = filtros.query?.trim()

  const where: Prisma.QuestaoWhereInput = {
    publicada: true,
    ...(filtros.bancaIds?.length ? { bancaId: { in: filtros.bancaIds } } : {}),
    ...(filtros.dificuldades?.length ? { dificuldade: { in: filtros.dificuldades } } : {}),
    ...(filtros.anos?.length ? { ano: { in: filtros.anos } } : {}),
    AND: [
      ...(filtros.temaIds?.length
        ? [{ temas: { some: { temaId: { in: filtros.temaIds } } } }]
        : []),
      ...(filtros.especialidadeIds?.length
        ? [{ temas: { some: { tema: { especialidadeId: { in: filtros.especialidadeIds } } } } }]
        : []),
    ],
    ...(termo
      ? {
          OR: [
            { enunciado: { contains: termo, mode: 'insensitive' } },
            { enunciadoVignette: { contains: termo, mode: 'insensitive' } },
            { alternativas: { some: { texto: { contains: termo, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  }

  if (situacao === 'TODAS') return where

  const [respostas, vencidas] = await Promise.all([
    prisma.resposta.findMany({
      where: { userId },
      select: { questaoId: true, correta: true, confianca: true, createdAt: true },
    }),
    situacao === 'REVISAO_VENCIDA'
      ? prisma.itemRevisao.findMany({
          where: { userId, proximaRevisao: { lte: new Date() } },
          select: { questaoId: true },
        })
      : Promise.resolve([]),
  ])

  const restricao = restricaoPorSituacao(
    situacao,
    resumirHistorico(respostas),
    vencidas.map((v) => v.questaoId),
  )
  if (restricao.tipo === 'incluir') return { ...where, id: { in: restricao.ids } }
  if (restricao.tipo === 'excluir') return { ...where, id: { notIn: restricao.ids } }
  return where
}
