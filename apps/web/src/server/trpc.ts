import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@residencia-med/db'
import { supabaseUserAtual, SUPABASE_HABILITADO } from '../lib/supabase/server'

export type Contexto = {
  authId: string | null
  email: string | null
  prisma: typeof prisma
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

/**
 * Resolve usuário a partir de um token Bearer (mobile / API externa).
 * Usa o anon client em modo stateless: confia na assinatura JWT do Supabase.
 */
async function userFromBearerToken(token: string) {
  if (!SUPABASE_HABILITADO) return null
  try {
    const supa = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data, error } = await supa.auth.getUser(token)
    if (error || !data.user) return null
    return data.user
  } catch {
    return null
  }
}

export async function createContext(req?: Request): Promise<Contexto> {
  // Bearer token tem prioridade (mobile)
  const auth = req?.headers.get('authorization') ?? req?.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim()
    const u = await userFromBearerToken(token)
    if (u) {
      return {
        authId: u.id,
        email: u.email ?? null,
        prisma,
      }
    }
  }

  // Cookie-based (web)
  const { user } = await supabaseUserAtual()
  return {
    authId: user?.id ?? null,
    email: user?.email ?? null,
    prisma,
  }
}

const t = initTRPC.context<Contexto>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const procedurePublica = t.procedure

export const procedureProtegida = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.authId || !ctx.email) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  const user = await garantirUser(ctx.authId, ctx.email)
  return next({
    ctx: {
      ...ctx,
      authId: ctx.authId,
      email: ctx.email,
      user,
      // back-compat: rotas antigas usavam ctx.userId (banco)
      userId: user.id,
    },
  })
})

/**
 * JIT-provisioning: cria a row de User na primeira vez que o usuário Supabase
 * acessa a aplicação. authId é o `auth.users.id` (UUID) do Supabase.
 */
export async function garantirUser(authId: string, email: string) {
  const existente = await prisma.user.findUnique({ where: { authId } })
  if (existente) return existente

  // Pode existir um row antigo com mesmo email — vincula em vez de duplicar
  const porEmail = await prisma.user.findUnique({ where: { email } })
  if (porEmail) {
    return prisma.user.update({
      where: { id: porEmail.id },
      data: { authId },
    })
  }

  return prisma.user.create({
    data: { authId, email },
  })
}
