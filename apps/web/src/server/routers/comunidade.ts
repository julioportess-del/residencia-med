import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

const CategoriaZ = z.enum(['DISCUSSAO', 'DUVIDA', 'DICA', 'DESABAFO'])

// Janela de dedupe de notificação: se o autor já recebeu notif do mesmo post nessa janela,
// não cria outra pra evitar sino cheio quando um post vira centro de conversa.
const DEDUPE_NOTIFICACAO_MS = 60 * 60 * 1000 // 1h
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
      // Marca de ownership pro cliente decidir se mostra botão Editar — evita roundtrip extra.
      const souAutorPost = post.userId === ctx.userId
      const comentarios = post.comentarios.map((c) => ({
        ...c,
        souAutor: c.userId === ctx.userId,
        foiEditado: c.updatedAt.getTime() - c.createdAt.getTime() > 1000,
      }))
      return {
        ...post,
        comentarios,
        souAutor: souAutorPost,
        foiEditado: post.updatedAt.getTime() - post.createdAt.getTime() > 1000,
      }
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

  editarPost: procedureProtegida
    .input(
      z.object({
        id: z.string().cuid(),
        titulo: z.string().trim().min(3).max(200),
        corpo: z.string().trim().min(10).max(10_000),
        categoria: CategoriaZ,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.postComunidade.findUnique({
        where: { id: input.id },
        select: { userId: true, ocultoEm: true },
      })
      if (!post) throw new TRPCError({ code: 'NOT_FOUND' })
      if (post.userId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' })
      if (post.ocultoEm) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Post oculto pela moderação não pode ser editado.',
        })
      }
      return ctx.prisma.postComunidade.update({
        where: { id: input.id },
        data: { titulo: input.titulo, corpo: input.corpo, categoria: input.categoria },
      })
    }),

  editarComentario: procedureProtegida
    .input(
      z.object({
        id: z.string().cuid(),
        corpo: z.string().trim().min(1).max(5_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const c = await ctx.prisma.comentarioComunidade.findUnique({
        where: { id: input.id },
        select: { userId: true, ocultoEm: true },
      })
      if (!c) throw new TRPCError({ code: 'NOT_FOUND' })
      if (c.userId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' })
      if (c.ocultoEm) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Comentário oculto pela moderação não pode ser editado.',
        })
      }
      return ctx.prisma.comentarioComunidade.update({
        where: { id: input.id },
        data: { corpo: input.corpo },
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
        const link = `/comunidade/${post.id}`
        // Dedupe: 1 notif/hora por post pro autor. Se já tem notif ativa pro mesmo link
        // dentro da janela, pula (evita sino cheio em thread agitada).
        const janelaInicio = new Date(Date.now() - DEDUPE_NOTIFICACAO_MS)
        const jaNotificado = await ctx.prisma.notificacao.findFirst({
          where: {
            userId: post.userId,
            tipo: 'COMENTARIO_COMUNIDADE',
            link,
            createdAt: { gte: janelaInicio },
          },
          select: { id: true },
        })
        if (!jaNotificado) {
          const autor = ctx.user.name ?? ctx.user.email.split('@')[0] ?? 'alguém'
          const previa = input.corpo.length > 140 ? input.corpo.slice(0, 137) + '…' : input.corpo
          await ctx.prisma.notificacao
            .create({
              data: {
                userId: post.userId,
                tipo: 'COMENTARIO_COMUNIDADE',
                titulo: `${autor} comentou em "${post.titulo}"`,
                conteudo: previa,
                link,
              },
            })
            // Notificação é side-effect — não falha o comentário se a criação der ruim
            .catch(() => undefined)
        }
      }

      return comentario
    }),
})
