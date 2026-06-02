import { PrismaClient } from './generated/client'

const globalForPrismaClinico = globalThis as unknown as {
  prismaClinico: PrismaClient | undefined
}

export const prismaClinico =
  globalForPrismaClinico.prismaClinico ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaClinico.prismaClinico = prismaClinico
}
