import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

export const pushRouter = router({
  /**
   * Salva uma PushSubscription gerada pelo browser.
   * Idempotente por endpoint (unique).
   */
  inscrever: procedureProtegida
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string().min(8),
        auth: z.string().min(8),
        userAgent: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        create: {
          userId: ctx.userId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent,
        },
        update: {
          userId: ctx.userId,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent,
        },
      })
      return { ok: true }
    }),

  cancelar: procedureProtegida
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.pushSubscription.deleteMany({
        where: { endpoint: input.endpoint, userId: ctx.userId },
      })
      return { ok: true }
    }),

  vapidPublicKey: procedureProtegida.query(() => {
    const k = process.env.VAPID_PUBLIC_KEY
    if (!k || k.includes('placeholder')) return null
    return k
  }),

  status: procedureProtegida.query(async ({ ctx }) => {
    const c = await ctx.prisma.pushSubscription.count({ where: { userId: ctx.userId } })
    return {
      inscrito: c > 0,
      total: c,
      vapidConfigurado: Boolean(
        process.env.VAPID_PUBLIC_KEY &&
          !process.env.VAPID_PUBLIC_KEY.includes('placeholder'),
      ),
    }
  }),
})
