/**
 * Configuracao de planos B2C e B2B.
 * Doc: docs/ROADMAP.md Turno 4 + docs/adr/0004-multi-tenant-strategy.md
 */

export const PLANO_FREE = 'FREE'
export const PLANO_PRO = 'PRO'
export const PLANO_PREMIUM = 'PREMIUM'

export type PlanoCodigo = 'FREE' | 'PRO' | 'PREMIUM'
export type PlanoOrgCodigo = 'STARTER' | 'GROWTH' | 'ENTERPRISE'

export type LimitesPlano = {
  questoesMes: number // -1 = ilimitado
  simuladoSemana: number
  iaExplicacoesMes: number
  gerarQuestoesIA: boolean
  prioridadeFila: number // 1-10, maior = mais rapido
  exportRelatorios: boolean
}

export type DefinicaoPlano = {
  codigo: PlanoCodigo
  nome: string
  descricao: string
  precoMensalCentavos: number
  precoAnualCentavos: number
  limites: LimitesPlano
  destaques: string[]
  trialDias?: number
}

export const PLANOS_B2C: Record<PlanoCodigo, DefinicaoPlano> = {
  FREE: {
    codigo: 'FREE',
    nome: 'Free',
    descricao: 'Para quem esta comecando a explorar a plataforma',
    precoMensalCentavos: 0,
    precoAnualCentavos: 0,
    limites: {
      questoesMes: 100,
      simuladoSemana: 1,
      iaExplicacoesMes: 0,
      gerarQuestoesIA: false,
      prioridadeFila: 1,
      exportRelatorios: false,
    },
    destaques: [
      '100 questoes por mes',
      '1 simulado por semana',
      'Explicacoes pre-escritas',
      'Plano de estudo basico',
    ],
  },
  PRO: {
    codigo: 'PRO',
    nome: 'Pro',
    descricao: 'Para quem ja tem rotina e quer ritmo de aprovacao',
    precoMensalCentavos: 1900,
    precoAnualCentavos: 18900,
    trialDias: 7,
    limites: {
      questoesMes: -1,
      simuladoSemana: -1,
      iaExplicacoesMes: 50,
      gerarQuestoesIA: false,
      prioridadeFila: 5,
      exportRelatorios: true,
    },
    destaques: [
      'Questoes ilimitadas',
      'Simulados ilimitados',
      'Plano adaptativo + repeticao espacada',
      '50 explicacoes com IA por mes',
      'Exportar relatorios de desempenho',
    ],
  },
  PREMIUM: {
    codigo: 'PREMIUM',
    nome: 'Premium',
    descricao: 'Reta final, simulados em massa e IA sem limite',
    precoMensalCentavos: 3900,
    precoAnualCentavos: 38900,
    trialDias: 7,
    limites: {
      questoesMes: -1,
      simuladoSemana: -1,
      iaExplicacoesMes: -1,
      gerarQuestoesIA: true,
      prioridadeFila: 9,
      exportRelatorios: true,
    },
    destaques: [
      'Tudo do Pro',
      'IA ilimitada',
      'Geracao de questoes parecidas',
      'Prioridade em filas',
      'Suporte prioritario',
    ],
  },
}

export type DefinicaoPlanoOrg = {
  codigo: PlanoOrgCodigo
  nome: string
  descricao: string
  precoMensalCentavos: number
  seatsIncluidos: number
  seatAdicionalCentavos: number
}

export const PLANOS_B2B: Record<PlanoOrgCodigo, DefinicaoPlanoOrg> = {
  STARTER: {
    codigo: 'STARTER',
    nome: 'Starter',
    descricao: 'Cursinhos e equipes ate 10 alunos',
    precoMensalCentavos: 9900,
    seatsIncluidos: 10,
    seatAdicionalCentavos: 1500,
  },
  GROWTH: {
    codigo: 'GROWTH',
    nome: 'Growth',
    descricao: 'Ate 50 alunos com painel de admin',
    precoMensalCentavos: 29900,
    seatsIncluidos: 50,
    seatAdicionalCentavos: 1200,
  },
  ENTERPRISE: {
    codigo: 'ENTERPRISE',
    nome: 'Enterprise',
    descricao: 'Acima de 50 alunos, contrato customizado',
    precoMensalCentavos: 0, // sob consulta
    seatsIncluidos: 0,
    seatAdicionalCentavos: 0,
  },
}

export function precoFormatado(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

export function precoIdEnv(plano: PlanoCodigo, ciclo: 'monthly' | 'annual'): string | undefined {
  const map: Record<string, string | undefined> = {
    'PRO:monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
    'PRO:annual': process.env.STRIPE_PRICE_PRO_ANNUAL,
    'PREMIUM:monthly': process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    'PREMIUM:annual': process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
  }
  return map[`${plano}:${ciclo}`]
}
