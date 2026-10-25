import { TRPCError } from '@trpc/server'
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

const FASE_ENUM = z.enum(['EXTENSIVO', 'RETA_FINAL'])
const TIPO_VIDEO = z.enum(['BASE', 'APROFUNDADA'])
const TIPO_MATERIAL = z.enum([
  'MAPA_MENTAL',
  'APOSTILA',
  'RESUMO_ESTRATEGICO',
  'SLIDE_AULA',
  'OUTRO',
])

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80)
}

export const adminCursosRouter = router({
  // ==================== GRANDE AREA ====================

  listarGrandesAreas: procedureAdmin
    .input(z.object({ fase: FASE_ENUM.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const areas = await ctx.prisma.grandeArea.findMany({
        where: input?.fase ? { fase: input.fase } : {},
        orderBy: [{ fase: 'asc' }, { ordem: 'asc' }, { nome: 'asc' }],
        include: { _count: { select: { disciplinas: true } } },
      })
      return areas.map((a) => ({
        id: a.id,
        slug: a.slug,
        nome: a.nome,
        descricao: a.descricao,
        capaUrl: a.capaUrl,
        corTema: a.corTema,
        fase: a.fase,
        ordem: a.ordem,
        publicado: a.publicado,
        totalDisciplinas: a._count.disciplinas,
      }))
    }),

  obterGrandeArea: procedureAdmin
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const area = await ctx.prisma.grandeArea.findUnique({ where: { id: input.id } })
      if (!area) throw new TRPCError({ code: 'NOT_FOUND' })
      return area
    }),

  criarGrandeArea: procedureAdmin
    .input(
      z.object({
        nome: z.string().min(2).max(120),
        slug: z.string().optional(),
        descricao: z.string().max(2000).optional(),
        capaUrl: z.string().url().optional().or(z.literal('')),
        corTema: z.string().max(32).optional(),
        fase: FASE_ENUM.default('EXTENSIVO'),
        ordem: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug?.trim() ? toSlug(input.slug) : toSlug(input.nome)
      try {
        return await ctx.prisma.grandeArea.create({
          data: {
            slug,
            nome: input.nome,
            descricao: input.descricao || null,
            capaUrl: input.capaUrl || null,
            corTema: input.corTema || null,
            fase: input.fase,
            ordem: input.ordem,
          },
        })
      } catch (erro) {
        if (ehUnicoViolado(erro)) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Já existe Grande Área com slug "${slug}"`,
          })
        }
        throw erro
      }
    }),

  editarGrandeArea: procedureAdmin
    .input(
      z.object({
        id: z.string(),
        nome: z.string().min(2).max(120).optional(),
        slug: z.string().optional(),
        descricao: z.string().max(2000).nullable().optional(),
        capaUrl: z.string().url().nullable().optional().or(z.literal('')),
        corTema: z.string().max(32).nullable().optional(),
        fase: FASE_ENUM.optional(),
        ordem: z.number().int().min(0).optional(),
        publicado: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, slug, ...rest } = input
      return ctx.prisma.grandeArea.update({
        where: { id },
        data: {
          ...rest,
          ...(slug ? { slug: toSlug(slug) } : {}),
          ...(input.capaUrl === '' ? { capaUrl: null } : {}),
        },
      })
    }),

  removerGrandeArea: procedureAdmin
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.grandeArea.delete({ where: { id: input.id } })
      return { ok: true }
    }),

  // ==================== DISCIPLINA ====================

  listarDisciplinas: procedureAdmin
    .input(z.object({ grandeAreaId: z.string() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.disciplina.findMany({
        where: { grandeAreaId: input.grandeAreaId },
        orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
        include: { _count: { select: { aulas: true } } },
      })
      return items.map((d) => ({
        id: d.id,
        slug: d.slug,
        nome: d.nome,
        codigo: d.codigo,
        ordem: d.ordem,
        totalAulas: d._count.aulas,
      }))
    }),

  obterDisciplina: procedureAdmin
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const disc = await ctx.prisma.disciplina.findUnique({
        where: { id: input.id },
        include: { grandeArea: { select: { id: true, nome: true, slug: true } } },
      })
      if (!disc) throw new TRPCError({ code: 'NOT_FOUND' })
      return disc
    }),

  criarDisciplina: procedureAdmin
    .input(
      z.object({
        grandeAreaId: z.string(),
        nome: z.string().min(2).max(120),
        slug: z.string().optional(),
        codigo: z.string().max(32).optional(),
        ordem: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug?.trim() ? toSlug(input.slug) : toSlug(input.nome)
      try {
        return await ctx.prisma.disciplina.create({
          data: {
            grandeAreaId: input.grandeAreaId,
            slug,
            nome: input.nome,
            codigo: input.codigo || null,
            ordem: input.ordem,
          },
        })
      } catch (erro) {
        if (ehUnicoViolado(erro)) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Já existe disciplina com slug "${slug}" nessa área`,
          })
        }
        throw erro
      }
    }),

  editarDisciplina: procedureAdmin
    .input(
      z.object({
        id: z.string(),
        nome: z.string().min(2).max(120).optional(),
        slug: z.string().optional(),
        codigo: z.string().max(32).nullable().optional(),
        ordem: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, slug, ...rest } = input
      return ctx.prisma.disciplina.update({
        where: { id },
        data: {
          ...rest,
          ...(slug ? { slug: toSlug(slug) } : {}),
        },
      })
    }),

  removerDisciplina: procedureAdmin
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.disciplina.delete({ where: { id: input.id } })
      return { ok: true }
    }),

  // ==================== AULA ====================

  listarAulas: procedureAdmin
    .input(z.object({ disciplinaId: z.string() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.aula.findMany({
        where: { disciplinaId: input.disciplinaId },
        orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
        include: {
          _count: { select: { videos: true, materiais: true } },
        },
      })
      return items.map((a) => ({
        id: a.id,
        slug: a.slug,
        titulo: a.titulo,
        descricao: a.descricao,
        ordem: a.ordem,
        totalVideos: a._count.videos,
        totalMateriais: a._count.materiais,
      }))
    }),

  obterAula: procedureAdmin.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const aula = await ctx.prisma.aula.findUnique({
      where: { id: input.id },
      include: {
        disciplina: {
          include: { grandeArea: { select: { id: true, nome: true } } },
        },
        videos: { orderBy: { tipo: 'asc' } },
        materiais: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!aula) throw new TRPCError({ code: 'NOT_FOUND' })
    return aula
  }),

  criarAula: procedureAdmin
    .input(
      z.object({
        disciplinaId: z.string(),
        titulo: z.string().min(2).max(200),
        slug: z.string().optional(),
        descricao: z.string().max(2000).optional(),
        ordem: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug?.trim() ? toSlug(input.slug) : toSlug(input.titulo)
      try {
        return await ctx.prisma.aula.create({
          data: {
            disciplinaId: input.disciplinaId,
            slug,
            titulo: input.titulo,
            descricao: input.descricao || null,
            ordem: input.ordem,
          },
        })
      } catch (erro) {
        if (ehUnicoViolado(erro)) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Já existe aula com slug "${slug}" nessa disciplina`,
          })
        }
        throw erro
      }
    }),

  editarAula: procedureAdmin
    .input(
      z.object({
        id: z.string(),
        titulo: z.string().min(2).max(200).optional(),
        slug: z.string().optional(),
        descricao: z.string().max(2000).nullable().optional(),
        ordem: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, slug, ...rest } = input
      return ctx.prisma.aula.update({
        where: { id },
        data: {
          ...rest,
          ...(slug ? { slug: toSlug(slug) } : {}),
        },
      })
    }),

  removerAula: procedureAdmin
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.aula.delete({ where: { id: input.id } })
      return { ok: true }
    }),

  // ==================== VIDEO ====================

  adicionarVideo: procedureAdmin
    .input(
      z.object({
        aulaId: z.string(),
        tipo: TIPO_VIDEO,
        titulo: z.string().min(2).max(200),
        duracaoS: z.number().int().min(0).default(0),
        provider: z.string().default('mux'),
        providerId: z.string().min(1).max(200),
        thumbUrl: z.string().url().optional().or(z.literal('')),
        apresentador: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.videoAula.create({
        data: {
          aulaId: input.aulaId,
          tipo: input.tipo,
          titulo: input.titulo,
          duracaoS: input.duracaoS,
          provider: input.provider,
          providerId: input.providerId,
          thumbUrl: input.thumbUrl || null,
          apresentador: input.apresentador || null,
        },
      })
    }),

  removerVideo: procedureAdmin
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.videoAula.delete({ where: { id: input.id } })
      return { ok: true }
    }),

  // ==================== MATERIAL ====================

  adicionarMaterial: procedureAdmin
    .input(
      z.object({
        aulaId: z.string(),
        tipo: TIPO_MATERIAL,
        titulo: z.string().min(2).max(200),
        url: z.string().url(),
        tamanhoBytes: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.materialAula.create({
        data: {
          aulaId: input.aulaId,
          tipo: input.tipo,
          titulo: input.titulo,
          url: input.url,
          tamanhoBytes: input.tamanhoBytes ?? null,
        },
      })
    }),

  removerMaterial: procedureAdmin
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.materialAula.delete({ where: { id: input.id } })
      return { ok: true }
    }),
})

function ehUnicoViolado(erro: unknown): boolean {
  return (
    typeof erro === 'object' &&
    erro !== null &&
    'code' in erro &&
    (erro as { code: unknown }).code === 'P2002'
  )
}
