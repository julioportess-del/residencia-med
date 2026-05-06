import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/routers/_app'
import { createContext } from '@/server/trpc'

export const dynamic = 'force-dynamic'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`tRPC error em ${path}:`, error)
      }
    },
  })

export { handler as GET, handler as POST }
