import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from '@clerk/nextjs/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { prisma } from '@residencia-med/db'

export type Contexto = {
  userId: string | null
  prisma: typeof prisma
}

export async function createContext(): Promise<Contexto> {
  const { userId } = await auth()
  return { userId, prisma }
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
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  const user = await garantirUser(ctx.userId)
  return next({ ctx: { ...ctx, userId: ctx.userId, user } })
})

export async function garantirUser(clerkId: string) {
  const existente = await prisma.user.findUnique({ where: { clerkId } })
  if (existente) return existente

  return prisma.user.create({
    data: {
      clerkId,
      email: `${clerkId}@placeholder.local`,
    },
  })
}
