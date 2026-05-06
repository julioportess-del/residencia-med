import { createTRPCReact } from '@trpc/react-query'

// Type-only import — apps/web e apps/mobile compartilham o roteador tRPC.
// O bundler nao acompanha apps/web em runtime; importacao type-only nao gera codigo.
import type { AppRouter } from '../../web/src/server/routers/_app'

export const trpc = createTRPCReact<AppRouter>()
export type { AppRouter }
