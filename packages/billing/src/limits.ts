/**
 * Helpers para verificar uso vs limite por plano.
 *
 * Doc: docs/ARCHITECTURE.md secao 7.
 */

import { startOfMonth, startOfWeek } from 'date-fns'
import { prisma } from '@residencia-med/db'
import { ehContaMaster } from './conta-master'
import { PLANOS_B2C, type LimitesPlano, type PlanoCodigo } from './plans'

export type ResultadoLimite = {
  permitido: boolean
  usado: number
  limite: number
  motivo?: string
}

export function temAcesso(plano: PlanoCodigo, recurso: keyof LimitesPlano): boolean {
  const limites = PLANOS_B2C[plano].limites
  const valor = limites[recurso]
  if (typeof valor === 'boolean') return valor
  return valor !== 0
}

export async function obterPlanoUsuario(userId: string): Promise<PlanoCodigo> {
  // 0) Conta master: acesso total sem assinatura
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (ehContaMaster(user?.email)) return 'PREMIUM'

  // 1) Plano herdado da organização tem prioridade
  const orgPlano = await planoHerdadoDaOrg(userId)
  if (orgPlano) return orgPlano

  // 2) Caso contrário, assinatura individual
  const ass = await prisma.assinatura.findUnique({
    where: { userId },
    select: { plano: true, status: true, validaAte: true },
  })
  if (!ass) return 'FREE'
  const ativaOuTrial = ass.status === 'ATIVA' || ass.status === 'TRIAL'
  const dentroDoVencimento = !ass.validaAte || ass.validaAte > new Date()
  if (ativaOuTrial && dentroDoVencimento) {
    return ass.plano as PlanoCodigo
  }
  return 'FREE'
}

/**
 * Se o usuário pertence a uma org com assinatura ativa/trial, retorna o plano B2C
 * equivalente que ele herda. STARTER → PRO; GROWTH/ENTERPRISE → PREMIUM.
 */
async function planoHerdadoDaOrg(userId: string): Promise<PlanoCodigo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organization: {
        select: {
          plano: true,
          assinatura: {
            select: { status: true, validaAte: true },
          },
        },
      },
    },
  })
  const org = user?.organization
  if (!org) return null
  const ass = org.assinatura
  if (ass) {
    const ativa = ass.status === 'ATIVA' || ass.status === 'TRIAL'
    const valida = !ass.validaAte || ass.validaAte > new Date()
    if (!(ativa && valida)) return null
  }
  return org.plano === 'STARTER' ? 'PRO' : 'PREMIUM'
}

export async function checarLimiteQuestoes(userId: string): Promise<ResultadoLimite> {
  const plano = await obterPlanoUsuario(userId)
  const limites = PLANOS_B2C[plano].limites
  const limite = limites.questoesMes
  if (limite === -1) return { permitido: true, usado: 0, limite: -1 }

  const usado = await prisma.resposta.count({
    where: { userId, createdAt: { gte: startOfMonth(new Date()) } },
  })
  return {
    permitido: usado < limite,
    usado,
    limite,
    motivo:
      usado >= limite
        ? `Limite de ${limite} questoes/mes atingido no plano ${plano}. Faca upgrade para continuar.`
        : undefined,
  }
}

export async function checarLimiteSimulados(userId: string): Promise<ResultadoLimite> {
  const plano = await obterPlanoUsuario(userId)
  const limites = PLANOS_B2C[plano].limites
  const limite = limites.simuladoSemana
  if (limite === -1) return { permitido: true, usado: 0, limite: -1 }

  const usado = await prisma.sessao.count({
    where: {
      userId,
      tipo: 'SIMULADO',
      iniciadaEm: { gte: startOfWeek(new Date(), { weekStartsOn: 1 }) },
    },
  })
  return {
    permitido: usado < limite,
    usado,
    limite,
    motivo:
      usado >= limite
        ? `Limite de ${limite} simulado(s)/semana atingido no plano ${plano}.`
        : undefined,
  }
}

export async function checarLimiteIA(userId: string): Promise<ResultadoLimite> {
  const plano = await obterPlanoUsuario(userId)
  const limites = PLANOS_B2C[plano].limites
  const limite = limites.iaExplicacoesMes
  if (limite === 0) {
    return {
      permitido: false,
      usado: 0,
      limite: 0,
      motivo: 'Explicacoes com IA disponiveis no plano Pro ou Premium.',
    }
  }
  if (limite === -1) return { permitido: true, usado: 0, limite: -1 }

  const usado = await prisma.lLMCall.count({
    where: {
      userId,
      funcao: 'explicarErro',
      cacheHit: false,
      status: 'sucesso',
      createdAt: { gte: startOfMonth(new Date()) },
    },
  })
  return {
    permitido: usado < limite,
    usado,
    limite,
    motivo:
      usado >= limite
        ? `Limite de ${limite} explicacoes IA/mes atingido. Upgrade para Premium para uso ilimitado.`
        : undefined,
  }
}
