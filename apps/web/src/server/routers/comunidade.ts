import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

const CategoriaZ = z.enum(['DISCUSSAO', 'DUVIDA', 'DICA', 'DESABAFO'])

export const comunidadeRouter = router({
  listar: procedureProtegida
    .input(
      z
        .object({
          categoria: CategoriaZ.optional(),
          limit: z.number().int().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.postComunidade.findMany({
        where: input?.categoria ? { categoria: input.categoria } : undefined,
        orderBy: { createdAt: 'desc' },
        take: input?.limit ?? 20,
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { comentarios: true } },
        },
      })
      return posts.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        corpo: p.corpo,
        categoria: p.categoria,
        createdAt: p.createdAt,
        autor: p.user.name ?? p.user.email.split('@')[0] ?? 'anônimo',
        totalComentarios: p._count.comentarios,
      }))
    }),

  obter: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.postComunidade.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { name: true, email: true } },
          comentarios: {
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { name: true, email: true } } },
          },
        },
      })
      if (!post) throw new TRPCError({ code: 'NOT_FOUND' })
      return post
    }),

  criar: procedureProtegida
    .input(
      z.object({
        titulo: z.string().trim().min(3).max(200),
        corpo: z.string().trim().min(10).max(10_000),
        categoria: CategoriaZ,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.postComunidade.create({
        data: {
          userId: ctx.userId,
          titulo: input.titulo,
          corpo: input.corpo,
          categoria: input.categoria,
        },
      })
    }),

  comentar: procedureProtegida
    .input(
      z.object({
        postId: z.string().cuid(),
        corpo: z.string().trim().min(1).max(5_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.comentarioComunidade.create({
        data: { postId: input.postId, userId: ctx.userId, corpo: input.corpo },
      })
    }),
})
