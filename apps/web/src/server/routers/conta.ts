import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { stripe } from '@residencia-med/billing'
import { router, procedureProtegida } from '../trpc'

export const contaRouter = router({
  excluir: procedureProtegida
    .input(z.object({ confirmacao: z.literal('EXCLUIR') }))
    .mutation(async ({ ctx, input }) => {
      void input.confirmacao

      const ass = await ctx.prisma.assinatura.findUnique({
        where: { userId: ctx.userId },
        select: { stripeSubscriptionId: true },
      })

      if (ass?.stripeSubscriptionId) {
        try {
          await stripe().subscriptions.cancel(ass.stripeSubscriptionId)
        } catch (e) {
          // se ja cancelada/inexistente, segue para delete
          if (process.env.NODE_ENV === 'development') {
            console.warn('[conta.excluir] cancel Stripe falhou', e)
          }
        }
      }

      // Cascade definido no schema: User -> Resposta, Sessao, PlanoEstudo, ItemRevisao, Assinatura
      try {
        await ctx.prisma.user.delete({ where: { id: ctx.userId } })
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Falha ao excluir conta: ${(e as Error).message}`,
        })
      }

      return { ok: true }
    }),

  exportarDados: procedureProtegida.query(async ({ ctx }) => {
    const u = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: {
        respostas: { take: 1000, orderBy: { createdAt: 'desc' } },
        sessoes: { take: 100, orderBy: { iniciadaEm: 'desc' } },
        planoEstudo: { include: { blocos: true } },
        itensRevisao: true,
        assinatura: true,
      },
    })
    if (!u) throw new TRPCError({ code: 'NOT_FOUND' })

    return {
      perfil: {
        email: u.email,
        nome: u.name,
        bancasAlvo: u.bancasAlvo,
        dataProva: u.dataProva,
        cargaHorariaSemanal: u.cargaHorariaSemanal,
        criadoEm: u.createdAt,
      },
      respostas: u.respostas,
      sessoes: u.sessoes,
      planoEstudo: u.planoEstudo,
      itensRevisao: u.itensRevisao,
      assinatura: u.assinatura,
      exportadoEm: new Date(),
    }
  }),
})
