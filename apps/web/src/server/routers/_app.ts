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
import { mentorRouter } from './mentor'
import { orgRouter } from './org'
import { apiKeysRouter } from './api-keys'
import { contribuicaoRouter } from './contribuicao'
import { simuladoLiveRouter } from './simulado-live'
import { proficienciaRouter } from './proficiencia'
import { notificacoesRouter } from './notificacoes'

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
  mentor: mentorRouter,
  org: orgRouter,
  apiKeys: apiKeysRouter,
  contribuicao: contribuicaoRouter,
  simuladoLive: simuladoLiveRouter,
  proficiencia: proficienciaRouter,
  notificacoes: notificacoesRouter,
})

export type AppRouter = typeof appRouter
