import { router } from '../trpc'
import { bancaRouter } from './banca'
import { questaoRouter } from './questao'
import { sessaoRouter } from './sessao'
import { dashboardRouter } from './dashboard'
import { onboardingRouter } from './onboarding'
import { planoRouter } from './plano'
import { revisaoRouter } from './revisao'
import { billingRouter, planosPublicosRouter } from './billing'
import { adminRouter } from './admin'
import { contaRouter } from './conta'

export const appRouter = router({
  banca: bancaRouter,
  questao: questaoRouter,
  sessao: sessaoRouter,
  dashboard: dashboardRouter,
  onboarding: onboardingRouter,
  plano: planoRouter,
  revisao: revisaoRouter,
  billing: billingRouter,
  planos: planosPublicosRouter,
  admin: adminRouter,
  conta: contaRouter,
})

export type AppRouter = typeof appRouter
