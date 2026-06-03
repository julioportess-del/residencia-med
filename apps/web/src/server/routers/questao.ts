import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { gerarQuestaoSimilar } from '@residencia-med/ai'
import { FiltroQuestoesInput, ResponderQuestaoInput } from '@residencia-med/types'
import { checarLimiteQuestoes, obterPlanoUsuario, temAcesso } from '@residencia-med/billing'
import { router, procedureProtegida } from '../trpc'
import { enqueueAtualizarRevisao } from '../../lib/queues'

export const questaoRouter = router({
  listar: procedureProtegida.input(FiltroQuestoesInput).query(async ({ ctx, input }) => {
    const where = {
      publicada: true,
      ...(input.bancaIds?.length ? { bancaId: { in: input.bancaIds } } : {}),
      ...(input.dificuldades?.length ? { dificuldade: { in: input.dificuldades } } : {}),
      ...(input.anos?.length ? { ano: { in: input.anos } } : {}),
      ...(input.temaIds?.length ? { temas: { some: { temaId: { in: input.temaIds } } } } : {}),
    }

    const questoes = await ctx.prisma.questao.findMany({
      where,
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      orderBy: [{ ano: 'desc' }, { id: 'asc' }],
      select: {
        id: true,
        ano: true,
        dificuldade: true,
        enunciado: true,
        banca: { select: { codigo: true, nome: true, cor: true } },
        temas: {
          where: { primario: true },
          select: { tema: { select: { id: true, nome: true, codigo: true } } },
          take: 1,
        },
        _count: { select: { respostas: { where: { userId: ctx.userId } } } },
      },
    })

    let proxCursor: string | undefined
    if (questoes.length > input.limit) {
      const ultimo = questoes.pop()
      proxCursor = ultimo?.id
    }

    return {
      itens: questoes.map((q) => ({
        id: q.id,
        ano: q.ano,
        dificuldade: q.dificuldade,
        resumo: q.enunciado.slice(0, 180),
        banca: q.banca,
        temaPrincipal: q.temas[0]?.tema ?? null,
        jaRespondida: q._count.respostas > 0,
      })),
      proxCursor,
    }
  }),

  /**
   * Devolve o ID da próxima questão publicada que o usuário ainda não respondeu
   * (na ordem do banco). Usa as bancas-alvo do usuário se houver.
   */
  proxima: procedureProtegida
    .input(z.object({ atualId: z.string().cuid().optional() }).default({}))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { bancasAlvo: true },
      })
      const bancaCodigos = user?.bancasAlvo ?? []
      const bancaIds = bancaCodigos.length
        ? (
            await ctx.prisma.banca.findMany({
              where: { codigo: { in: bancaCodigos } },
              select: { id: true },
            })
          ).map((b) => b.id)
        : []

      const respondidas = await ctx.prisma.resposta.findMany({
        where: { userId: ctx.userId },
        select: { questaoId: true },
        distinct: ['questaoId'],
      })
      const respondidasIds = respondidas.map((r) => r.questaoId)
      if (input.atualId) respondidasIds.push(input.atualId)

      const proxima = await ctx.prisma.questao.findFirst({
        where: {
          publicada: true,
          ...(bancaIds.length ? { bancaId: { in: bancaIds } } : {}),
          ...(respondidasIds.length ? { id: { notIn: respondidasIds } } : {}),
        },
        orderBy: [{ ano: 'desc' }, { id: 'asc' }],
        select: { id: true },
      })

      if (!proxima) {
        const fallback = await ctx.prisma.questao.findFirst({
          where: {
            publicada: true,
            ...(input.atualId ? { id: { not: input.atualId } } : {}),
          },
          orderBy: [{ ano: 'desc' }, { id: 'asc' }],
          select: { id: true },
        })
        return { id: fallback?.id ?? null }
      }
      return { id: proxima.id }
    }),

  detalhe: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const questao = await ctx.prisma.questao.findUnique({
        where: { id: input.id, publicada: true },
        include: {
          alternativas: { orderBy: { ordem: 'asc' } },
          banca: { select: { codigo: true, nome: true, cor: true } },
          prova: { select: { ano: true, tipo: true } },
          temas: {
            select: {
              primario: true,
              tema: { select: { id: true, nome: true, codigo: true } },
            },
          },
          guidelines: {
            select: {
              trecho: true,
              guideline: { select: { titulo: true, fonte: true, url: true, resumo: true } },
            },
          },
        },
      })
      if (!questao) throw new TRPCError({ code: 'NOT_FOUND' })
      return questao
    }),

  responder: procedureProtegida.input(ResponderQuestaoInput).mutation(async ({ ctx, input }) => {
    const limite = await checarLimiteQuestoes(ctx.userId)
    if (!limite.permitido) {
      throw new TRPCError({ code: 'FORBIDDEN', message: limite.motivo ?? 'Limite atingido' })
    }

    const questao = await ctx.prisma.questao.findUnique({
      where: { id: input.questaoId, publicada: true },
      include: { alternativas: true },
    })
    if (!questao) throw new TRPCError({ code: 'NOT_FOUND' })

    const escolhida = questao.alternativas.find((a) => a.letra === input.alternativaLetra)
    if (!escolhida) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Alternativa invalida' })

    const correta = escolhida.correta

    const resposta = await ctx.prisma.resposta.create({
      data: {
        userId: ctx.userId,
        questaoId: questao.id,
        alternativaId: escolhida.id,
        alternativaLetra: escolhida.letra,
        correta,
        tempoSegundos: input.tempoSegundos,
        confianca: input.confianca,
        sessaoId: input.sessaoId,
        modoRevisao: input.modoRevisao,
      },
    })

    if (input.sessaoId) {
      await ctx.prisma.sessao.update({
        where: { id: input.sessaoId },
        data: {
          acertos: { increment: correta ? 1 : 0 },
          erros: { increment: correta ? 0 : 1 },
          tempoTotal: { increment: input.tempoSegundos },
        },
      })
    }

    await enqueueAtualizarRevisao({
      userId: ctx.userId,
      questaoId: questao.id,
      respostaId: resposta.id,
    })

    return {
      respostaId: resposta.id,
      correta,
      gabaritoLetra: questao.gabaritoLetra,
      explicacaoMd: questao.explicacaoMd,
      alternativasErrosMd: Object.fromEntries(
        questao.alternativas
          .filter((a) => !a.correta && a.explicacaoErro)
          .map((a) => [a.letra, a.explicacaoErro ?? '']),
      ),
    }
  }),

  gerarSimilar: procedureProtegida
    .input(z.object({ questaoId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const plano = await obterPlanoUsuario(ctx.userId)
      if (!temAcesso(plano, 'gerarQuestoesIA')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Geração de questões parecidas é exclusiva do plano Premium.',
        })
      }

      const original = await ctx.prisma.questao.findUnique({
        where: { id: input.questaoId, publicada: true },
        include: {
          alternativas: { orderBy: { ordem: 'asc' } },
          banca: true,
          temas: {
            where: { primario: true },
            include: { tema: true },
            take: 1,
          },
        },
      })
      if (!original) throw new TRPCError({ code: 'NOT_FOUND' })

      const tema = original.temas[0]?.tema?.nome ?? 'tema clínico'

      const exemplos = await ctx.prisma.questao.findMany({
        where: {
          bancaId: original.bancaId,
          publicada: true,
          id: { not: original.id },
        },
        take: 2,
        include: { alternativas: { orderBy: { ordem: 'asc' } } },
        orderBy: { ano: 'desc' },
      })

      try {
        const gerada = await gerarQuestaoSimilar({
          bancaCodigo: original.banca.codigo,
          bancaNome: original.banca.nome,
          tema,
          exemplosBanca: [original, ...exemplos].map((q) => ({
            enunciado: q.enunciado,
            alternativas: q.alternativas.map((a) => ({
              letra: a.letra,
              texto: a.texto,
              correta: a.correta,
            })),
          })),
        })
        return gerada
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Falha ao gerar variação: ${(e as Error).message}`,
        })
      }
    }),
})
