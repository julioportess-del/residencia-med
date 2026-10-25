import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

const CategoriaZ = z.enum(['DISCUSSAO', 'DUVIDA', 'DICA', 'DESABAFO'])
const MotivoZ = z.enum(['SPAM', 'OFENSIVO', 'FORA_DO_TEMA', 'INFO_INCORRETA', 'OUTRO'])

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
        where: {
          ocultoEm: null, // esconde posts moderados
          ...(input?.categoria ? { categoria: input.categoria } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: input?.limit ?? 20,
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { comentarios: { where: { ocultoEm: null } } } },
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
      const post = await ctx.prisma.postComunidade.findFirst({
        where: { id: input.id, ocultoEm: null },
        include: {
          user: { select: { name: true, email: true } },
          comentarios: {
            where: { ocultoEm: null },
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { name: true, email: true } } },
          },
        },
      })
      if (!post) throw new TRPCError({ code: 'NOT_FOUND' })
      return post
    }),

  reportar: procedureProtegida
    .input(
      z
        .object({
          postId: z.string().cuid().optional(),
          comentarioId: z.string().cuid().optional(),
          motivo: MotivoZ,
          detalhes: z.string().trim().max(1000).optional(),
        })
        .refine((d) => Boolean(d.postId) !== Boolean(d.comentarioId), {
          message: 'Passe postId OU comentarioId, não ambos.',
        }),
    )
    .mutation(async ({ ctx, input }) => {
      // Dedupe: se o user já reportou esse mesmo alvo com status PENDENTE, não cria outro.
      const existente = await ctx.prisma.reporteComunidade.findFirst({
        where: {
          userId: ctx.userId,
          status: 'PENDENTE',
          postId: input.postId ?? null,
          comentarioId: input.comentarioId ?? null,
        },
      })
      if (existente) return { ok: true, dedupe: true }

      await ctx.prisma.reporteComunidade.create({
        data: {
          userId: ctx.userId,
          postId: input.postId ?? null,
          comentarioId: input.comentarioId ?? null,
          motivo: input.motivo,
          detalhes: input.detalhes || null,
        },
      })
      return { ok: true }
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
      const post = await ctx.prisma.postComunidade.findUnique({
        where: { id: input.postId },
        select: { id: true, userId: true, titulo: true },
      })
      if (!post) throw new TRPCError({ code: 'NOT_FOUND' })

      const comentario = await ctx.prisma.comentarioComunidade.create({
        data: { postId: input.postId, userId: ctx.userId, corpo: input.corpo },
      })

      // Notifica o autor do post — exceto se for ele mesmo comentando
      if (post.userId !== ctx.userId) {
        const autor = ctx.user.name ?? ctx.user.email.split('@')[0] ?? 'alguém'
        const previa = input.corpo.length > 140 ? input.corpo.slice(0, 137) + '…' : input.corpo
        await ctx.prisma.notificacao
          .create({
            data: {
              userId: post.userId,
              tipo: 'COMENTARIO_COMUNIDADE',
              titulo: `${autor} comentou em "${post.titulo}"`,
              conteudo: previa,
              link: `/comunidade/${post.id}`,
            },
          })
          // Notificação é side-effect — não falha o comentário se a criação der ruim
          .catch(() => undefined)
      }

      return comentario
    }),
})
