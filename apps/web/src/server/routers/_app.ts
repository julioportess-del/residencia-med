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
import { adminComunidadeRouter } from './admin-comunidade'
import { adminCursosRouter } from './admin-cursos'
import { adminTicketsRouter } from './admin-tickets'
import { contaRouter } from './conta'
import { mentorRouter } from './mentor'
import { orgRouter } from './org'
import { apiKeysRouter } from './api-keys'
import { contribuicaoRouter } from './contribuicao'
import { simuladoLiveRouter } from './simulado-live'
import { proficienciaRouter } from './proficiencia'
import { notificacoesRouter } from './notificacoes'
import { pushRouter } from './push'
import { experimentosRouter } from './experimentos'
import { cadernoRouter } from './caderno'
import { flashcardsRouter } from './flashcards'
import { minhasProvasRouter } from './minhas-provas'
import { comunidadeRouter } from './comunidade'
import { cursosRouter } from './cursos'
import { nivelRouter } from './nivel'
import { perfilCandidatoRouter } from './perfil-candidato'
import { suporteRouter } from './suporte'
import { vigiliaRouter } from './vigilia'

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
  adminCursos: adminCursosRouter,
  adminTickets: adminTicketsRouter,
  adminComunidade: adminComunidadeRouter,
  conta: contaRouter,
  mentor: mentorRouter,
  org: orgRouter,
  apiKeys: apiKeysRouter,
  contribuicao: contribuicaoRouter,
  simuladoLive: simuladoLiveRouter,
  proficiencia: proficienciaRouter,
  notificacoes: notificacoesRouter,
  push: pushRouter,
  experimentos: experimentosRouter,
  caderno: cadernoRouter,
  flashcards: flashcardsRouter,
  minhasProvas: minhasProvasRouter,
  nivel: nivelRouter,
  perfilCandidato: perfilCandidatoRouter,
  cursos: cursosRouter,
  comunidade: comunidadeRouter,
  suporte: suporteRouter,
  vigilia: vigiliaRouter,
})

export type AppRouter = typeof appRouter
