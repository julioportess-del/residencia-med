import { TRPCError } from '@trpc/server'
import type { Prisma } from '@residencia-med/db'
import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

const procedureAdmin = procedureProtegida.use(async ({ ctx, next }) => {
  if (!ADMIN_EMAILS.includes(ctx.user.email.toLowerCase())) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito' })
  }
  return next()
})

const StatusZ = z.enum(['PENDENTE', 'RESOLVIDO_OCULTO', 'RESOLVIDO_MANTIDO'])

export const adminComunidadeRouter = router({
  listarReportes: procedureAdmin
    .input(z.object({ status: StatusZ.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const reportes = await ctx.prisma.reporteComunidade.findMany({
        where: input?.status ? { status: input.status } : {},
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take: 200,
        include: {
          user: { select: { email: true, name: true } },
          post: {
            select: {
              id: true,
              titulo: true,
              corpo: true,
              categoria: true,
              ocultoEm: true,
              user: { select: { email: true, name: true } },
            },
          },
          comentario: {
            select: {
              id: true,
              corpo: true,
              ocultoEm: true,
              post: { select: { id: true, titulo: true } },
              user: { select: { email: true, name: true } },
            },
          },
        },
      })
      return reportes
    }),

  contagens: procedureAdmin.query(async ({ ctx }) => {
    const grupos = await ctx.prisma.reporteComunidade.groupBy({
      by: ['status'],
      _count: { _all: true },
    })
    const base: Record<'PENDENTE' | 'RESOLVIDO_OCULTO' | 'RESOLVIDO_MANTIDO', number> = {
      PENDENTE: 0,
      RESOLVIDO_OCULTO: 0,
      RESOLVIDO_MANTIDO: 0,
    }
    for (const g of grupos) base[g.status] = g._count._all
    return base
  }),

  ocultar: procedureAdmin
    .input(z.object({ reporteId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const reporte = await ctx.prisma.reporteComunidade.findUnique({
        where: { id: input.reporteId },
        select: { id: true, postId: true, comentarioId: true, status: true },
      })
      if (!reporte) throw new TRPCError({ code: 'NOT_FOUND' })
      if (reporte.status !== 'PENDENTE') {
        throw new TRPCError({ code: 'CONFLICT', message: 'Reporte já resolvido' })
      }

      const agora = new Date()
      const ops: Prisma.PrismaPromise<unknown>[] = [
        ctx.prisma.reporteComunidade.update({
          where: { id: input.reporteId },
          data: {
            status: 'RESOLVIDO_OCULTO',
            resolvidoEm: agora,
            resolvidoPor: ctx.userId,
          },
        }),
      ]
      if (reporte.postId) {
        ops.push(
          ctx.prisma.postComunidade.update({
            where: { id: reporte.postId },
            data: { ocultoEm: agora },
          }),
        )
      }
      if (reporte.comentarioId) {
        ops.push(
          ctx.prisma.comentarioComunidade.update({
            where: { id: reporte.comentarioId },
            data: { ocultoEm: agora },
          }),
        )
      }
      await ctx.prisma.$transaction(ops)
      return { ok: true }
    }),

  manter: procedureAdmin
    .input(z.object({ reporteId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.reporteComunidade.update({
        where: { id: input.reporteId },
        data: {
          status: 'RESOLVIDO_MANTIDO',
          resolvidoEm: new Date(),
          resolvidoPor: ctx.userId,
        },
      })
      return { ok: true }
    }),

  reexibir: procedureAdmin
    .input(
      z
        .object({
          postId: z.string().cuid().optional(),
          comentarioId: z.string().cuid().optional(),
        })
        .refine((d) => Boolean(d.postId) !== Boolean(d.comentarioId), {
          message: 'Passe postId OU comentarioId',
        }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.postId) {
        await ctx.prisma.postComunidade.update({
          where: { id: input.postId },
          data: { ocultoEm: null },
        })
      } else if (input.comentarioId) {
        await ctx.prisma.comentarioComunidade.update({
          where: { id: input.comentarioId },
          data: { ocultoEm: null },
        })
      }
      return { ok: true }
    }),
})
