import { TRPCError } from '@trpc/server'
import { subDays } from 'date-fns'
import { z } from 'zod'
import type { PrismaClient } from '@residencia-med/db'
import { router, procedureProtegida } from '../trpc'

const TITULO_PADRAO = 'Nova conversa'

export const mentorRouter = router({
  listar: procedureProtegida.query(async ({ ctx }) => {
    return ctx.prisma.conversaMentor.findMany({
      where: { userId: ctx.userId },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: {
        id: true,
        titulo: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { mensagens: true } },
      },
    })
  }),

  detalhe: procedureProtegida
    .input(z.object({ conversaId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const conversa = await ctx.prisma.conversaMentor.findFirst({
        where: { id: input.conversaId, userId: ctx.userId },
        include: {
          mensagens: { orderBy: { createdAt: 'asc' } },
        },
      })
      if (!conversa) throw new TRPCError({ code: 'NOT_FOUND' })
      return conversa
    }),

  criar: procedureProtegida
    .input(z.object({ titulo: z.string().max(120).optional() }))
    .mutation(async ({ ctx, input }) => {
      const contexto = await montarContextoUsuario(ctx.prisma, ctx.userId)
      const conversa = await ctx.prisma.conversaMentor.create({
        data: {
          userId: ctx.userId,
          titulo: input.titulo ?? TITULO_PADRAO,
          contextoJson: contexto as never,
        },
      })
      return conversa
    }),

  renomear: procedureProtegida
    .input(z.object({ conversaId: z.string().cuid(), titulo: z.string().min(1).max(120) }))
    .mutation(async ({ ctx, input }) => {
      const c = await ctx.prisma.conversaMentor.findFirst({
        where: { id: input.conversaId, userId: ctx.userId },
        select: { id: true },
      })
      if (!c) throw new TRPCError({ code: 'NOT_FOUND' })
      await ctx.prisma.conversaMentor.update({
        where: { id: input.conversaId },
        data: { titulo: input.titulo },
      })
      return { ok: true }
    }),

  excluir: procedureProtegida
    .input(z.object({ conversaId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const r = await ctx.prisma.conversaMentor.deleteMany({
        where: { id: input.conversaId, userId: ctx.userId },
      })
      if (r.count === 0) throw new TRPCError({ code: 'NOT_FOUND' })
      return { ok: true }
    }),
})

/**
 * Monta snapshot do contexto do usuário para alimentar o mentor.
 * Usado tanto no criar() quanto no endpoint de streaming (sempre fresco).
 */
export async function montarContextoUsuario(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      metaResidencia: true,
      dataProva: true,
      cargaHorariaSemanal: true,
    },
  })

  const [respostas, itensVencidos] = await Promise.all([
    prisma.resposta.findMany({
      where: { userId, createdAt: { gte: subDays(new Date(), 60) } },
      select: {
        correta: true,
        questao: {
          select: {
            temas: {
              where: { primario: true },
              select: { tema: { select: { id: true, nome: true } } },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.itemRevisao.count({
      where: { userId, proximaRevisao: { lte: new Date() } },
    }),
  ])

  const total = respostas.length
  const acertos = respostas.filter((r) => r.correta).length
  const taxa = total > 0 ? acertos / total : 0

  const porTema = new Map<string, { total: number; acertos: number; nome: string }>()
  for (const r of respostas) {
    const t = r.questao.temas[0]?.tema
    if (!t) continue
    const ent = porTema.get(t.id) ?? { total: 0, acertos: 0, nome: t.nome }
    ent.total++
    if (r.correta) ent.acertos++
    porTema.set(t.id, ent)
  }
  const lista = Array.from(porTema.values())
    .filter((v) => v.total >= 3)
    .map((v) => ({ tema: v.nome, taxa: v.acertos / v.total }))
  const fortes = [...lista].sort((a, b) => b.taxa - a.taxa).slice(0, 3)
  const fracos = [...lista].sort((a, b) => a.taxa - b.taxa).slice(0, 3)

  return {
    nome: user?.name ?? null,
    bancaAlvo: user?.metaResidencia ?? null,
    dataProva: user?.dataProva ?? null,
    cargaHorariaSemanal: user?.cargaHorariaSemanal ?? null,
    totalRespostas: total,
    taxaAcerto: taxa,
    fortes,
    fracos,
    itensRevisaoVencidos: itensVencidos,
  }
}
