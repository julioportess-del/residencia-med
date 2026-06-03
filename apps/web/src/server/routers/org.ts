import { randomBytes } from 'node:crypto'
import { TRPCError } from '@trpc/server'
import { addDays, subDays } from 'date-fns'
import { z } from 'zod'
import { criarSessaoCheckoutOrg, criarSessaoPortalOrg } from '@residencia-med/billing'
import { emailConviteOrg } from '@residencia-med/email'
import { criarNotificacao } from '../notificacoes'
import { router, procedureProtegida } from '../trpc'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function gerarToken(): string {
  return randomBytes(24).toString('hex')
}

function slugify(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
}

const procedureAdminOrg = procedureProtegida.use(async ({ ctx, next }) => {
  if (!ctx.user.organizationId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não pertence a uma organização' })
  }
  if (ctx.user.papelOrg !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem fazer isso' })
  }
  return next({
    ctx: { ...ctx, organizationId: ctx.user.organizationId },
  })
})

export const orgRouter = router({
  /**
   * Status da org do usuário atual: existe? membro ou admin?
   */
  status: procedureProtegida.query(async ({ ctx }) => {
    if (!ctx.user.organizationId) return { temOrg: false } as const
    const org = await ctx.prisma.organization.findUnique({
      where: { id: ctx.user.organizationId },
      include: {
        assinatura: true,
        _count: { select: { users: true } },
      },
    })
    if (!org) return { temOrg: false } as const
    return {
      temOrg: true,
      papel: ctx.user.papelOrg ?? 'MEMBRO',
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plano: org.plano,
        seats: org.seats,
        membros: org._count.users,
        assinatura: org.assinatura,
      },
    } as const
  }),

  criar: procedureProtegida
    .input(
      z.object({
        nome: z.string().min(2).max(100),
        plano: z.enum(['STARTER', 'GROWTH']).default('STARTER'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Você já pertence a uma organização',
        })
      }

      // Slug único: tenta nome, fallback com sufixo
      const baseSlug = slugify(input.nome) || `org-${Date.now()}`
      let slug = baseSlug
      let i = 0
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const ja = await ctx.prisma.organization.findUnique({ where: { slug } })
        if (!ja) break
        i += 1
        slug = `${baseSlug}-${i}`
        if (i > 50) throw new Error('Não consegui gerar slug único')
      }

      const seatsIniciais = input.plano === 'STARTER' ? 10 : 50

      const org = await ctx.prisma.organization.create({
        data: {
          name: input.nome,
          slug,
          plano: input.plano,
          seats: seatsIniciais,
        },
      })
      await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: { organizationId: org.id, papelOrg: 'ADMIN' },
      })

      return { organizationId: org.id, slug: org.slug }
    }),

  iniciarCheckout: procedureAdminOrg
    .input(
      z.object({
        plano: z.enum(['STARTER', 'GROWTH']),
        seats: z.number().int().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { url } = await criarSessaoCheckoutOrg({
          organizationId: ctx.organizationId,
          emailFaturamento: ctx.user.email,
          plano: input.plano,
          seats: input.seats,
          successUrl: `${APP_URL}/org?checkout=sucesso`,
          cancelUrl: `${APP_URL}/org?checkout=cancelado`,
        })
        return { url }
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: (e as Error).message,
        })
      }
    }),

  abrirPortal: procedureAdminOrg.mutation(async ({ ctx }) => {
    try {
      const { url } = await criarSessaoPortalOrg(ctx.organizationId, `${APP_URL}/org`)
      return { url }
    } catch (e) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: (e as Error).message })
    }
  }),

  membros: procedureAdminOrg.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        papelOrg: true,
        createdAt: true,
        _count: { select: { respostas: true } },
      },
    })
  }),

  removerMembro: procedureAdminOrg
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Você não pode remover a si mesmo. Transfira a admin antes.',
        })
      }
      const u = await ctx.prisma.user.findFirst({
        where: { id: input.userId, organizationId: ctx.organizationId },
      })
      if (!u) throw new TRPCError({ code: 'NOT_FOUND' })
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { organizationId: null, papelOrg: null },
      })
      return { ok: true }
    }),

  alterarPapel: procedureAdminOrg
    .input(z.object({ userId: z.string().cuid(), papel: z.enum(['ADMIN', 'MEMBRO']) }))
    .mutation(async ({ ctx, input }) => {
      const u = await ctx.prisma.user.findFirst({
        where: { id: input.userId, organizationId: ctx.organizationId },
      })
      if (!u) throw new TRPCError({ code: 'NOT_FOUND' })
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { papelOrg: input.papel },
      })
      return { ok: true }
    }),

  convitesPendentes: procedureAdminOrg.query(async ({ ctx }) => {
    return ctx.prisma.conviteOrg.findMany({
      where: {
        organizationId: ctx.organizationId,
        aceitoEm: null,
        revogadoEm: null,
        expiraEm: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        papel: true,
        expiraEm: true,
        createdAt: true,
      },
    })
  }),

  convidar: procedureAdminOrg
    .input(
      z.object({
        email: z.string().email(),
        papel: z.enum(['ADMIN', 'MEMBRO']).default('MEMBRO'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verifica seats disponíveis
      const org = await ctx.prisma.organization.findUnique({
        where: { id: ctx.organizationId },
        include: {
          _count: { select: { users: true } },
        },
      })
      if (!org) throw new TRPCError({ code: 'NOT_FOUND' })

      const convitesAtivos = await ctx.prisma.conviteOrg.count({
        where: {
          organizationId: ctx.organizationId,
          aceitoEm: null,
          revogadoEm: null,
          expiraEm: { gt: new Date() },
        },
      })
      const ocupados = org._count.users + convitesAtivos
      if (ocupados >= org.seats) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Sem assentos disponíveis (${ocupados}/${org.seats}). Faça upgrade ou remova um membro.`,
        })
      }

      // Já é membro?
      const ja = await ctx.prisma.user.findFirst({
        where: { email: input.email, organizationId: ctx.organizationId },
      })
      if (ja) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este email já é membro' })
      }

      // Convite duplicado ativo?
      const convitePend = await ctx.prisma.conviteOrg.findFirst({
        where: {
          organizationId: ctx.organizationId,
          email: input.email,
          aceitoEm: null,
          revogadoEm: null,
          expiraEm: { gt: new Date() },
        },
      })
      if (convitePend) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Já existe um convite pendente para este email',
        })
      }

      const token = gerarToken()
      const convite = await ctx.prisma.conviteOrg.create({
        data: {
          organizationId: ctx.organizationId,
          email: input.email,
          papel: input.papel,
          token,
          convidadoPor: ctx.userId,
          expiraEm: addDays(new Date(), 7),
        },
      })

      // Best-effort: envia email
      void emailConviteOrg(input.email, {
        nomeOrg: org.name,
        papel: input.papel,
        conviteUrl: `${APP_URL}/convite/${token}`,
        convidadoPorNome: ctx.user.name,
      }).catch(() => {})

      // Notificação in-app se já é usuário
      const userExistente = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      })
      if (userExistente) {
        await criarNotificacao({
          userId: userExistente.id,
          tipo: 'CONVITE_ORG',
          titulo: `Convite para ${org.name}`,
          conteudo: `${ctx.user.name ?? ctx.user.email} te convidou como ${input.papel}.`,
          link: `/convite/${token}`,
        })
      }

      return { conviteId: convite.id, token }
    }),

  revogarConvite: procedureAdminOrg
    .input(z.object({ conviteId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const c = await ctx.prisma.conviteOrg.findFirst({
        where: { id: input.conviteId, organizationId: ctx.organizationId },
      })
      if (!c) throw new TRPCError({ code: 'NOT_FOUND' })
      await ctx.prisma.conviteOrg.update({
        where: { id: input.conviteId },
        data: { revogadoEm: new Date() },
      })
      return { ok: true }
    }),

  // Aceitar convite NÃO requer ser admin (acessível por qualquer logado)
  aceitarConvite: procedureProtegida
    .input(z.object({ token: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Você já pertence a uma organização. Saia primeiro para aceitar este convite.',
        })
      }
      const convite = await ctx.prisma.conviteOrg.findUnique({
        where: { token: input.token },
        include: { organization: { include: { _count: { select: { users: true } } } } },
      })
      if (!convite) throw new TRPCError({ code: 'NOT_FOUND', message: 'Convite inválido' })
      if (convite.aceitoEm)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Convite já aceito' })
      if (convite.revogadoEm)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Convite revogado' })
      if (convite.expiraEm < new Date())
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Convite expirado' })
      if (convite.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Esse convite foi enviado para ${convite.email}. Entre com aquela conta.`,
        })
      }
      if (convite.organization._count.users >= convite.organization.seats) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'A organização atingiu o limite de assentos.',
        })
      }

      await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: ctx.userId },
          data: { organizationId: convite.organizationId, papelOrg: convite.papel },
        }),
        ctx.prisma.conviteOrg.update({
          where: { id: convite.id },
          data: { aceitoEm: new Date(), aceitoPor: ctx.userId },
        }),
      ])

      return {
        ok: true,
        organizationId: convite.organizationId,
        nomeOrg: convite.organization.name,
      }
    }),

  sair: procedureProtegida.mutation(async ({ ctx }) => {
    if (!ctx.user.organizationId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Você não está em uma organização' })
    }
    if (ctx.user.papelOrg === 'ADMIN') {
      const outroAdmin = await ctx.prisma.user.findFirst({
        where: {
          organizationId: ctx.user.organizationId,
          papelOrg: 'ADMIN',
          id: { not: ctx.userId },
        },
      })
      if (!outroAdmin) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Você é o único admin. Promova outro membro antes de sair.',
        })
      }
    }
    await ctx.prisma.user.update({
      where: { id: ctx.userId },
      data: { organizationId: null, papelOrg: null },
    })
    return { ok: true }
  }),

  /**
   * Dashboard agregado da org (apenas ADMIN). Estatísticas anônimas dos membros:
   * total de respostas, taxa média, top 5 temas mais fracos da equipe.
   */
  dashboardAgregado: procedureAdminOrg.query(async ({ ctx }) => {
    const ha30d = subDays(new Date(), 30)
    const [usuarios, respostasMes] = await Promise.all([
      ctx.prisma.user.count({ where: { organizationId: ctx.organizationId } }),
      ctx.prisma.resposta.findMany({
        where: {
          user: { organizationId: ctx.organizationId },
          createdAt: { gte: ha30d },
        },
        select: {
          correta: true,
          userId: true,
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
    ])

    const ativos30d = new Set(respostasMes.map((r) => r.userId)).size
    const totalRespostas = respostasMes.length
    const acertos = respostasMes.filter((r) => r.correta).length
    const taxa = totalRespostas > 0 ? acertos / totalRespostas : 0

    const porTema = new Map<string, { total: number; acertos: number; nome: string }>()
    for (const r of respostasMes) {
      const t = r.questao.temas[0]?.tema
      if (!t) continue
      const ent = porTema.get(t.id) ?? { total: 0, acertos: 0, nome: t.nome }
      ent.total++
      if (r.correta) ent.acertos++
      porTema.set(t.id, ent)
    }
    const fracos = Array.from(porTema.values())
      .filter((v) => v.total >= 5)
      .map((v) => ({ tema: v.nome, total: v.total, taxa: v.acertos / v.total }))
      .sort((a, b) => a.taxa - b.taxa)
      .slice(0, 5)

    return {
      usuariosTotal: usuarios,
      ativos30d,
      respostasMes: totalRespostas,
      taxaMedia: taxa,
      temasFracos: fracos,
    }
  }),
})
