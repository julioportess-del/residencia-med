import { prisma } from '@residencia-med/db'

export type LLMCallMetricas = {
  funcao: string
  modelo: string
  versaoPrompt: string
  cacheKey: string
  cacheHit: boolean
  inputTokens: number
  outputTokens: number
  latenciaMs: number
  custoUsd: number
  status: 'sucesso' | 'erro_provider' | 'erro_validacao'
  erro?: string
  userId?: string
}

// Precos por 1M tokens, atualizar conforme provider muda
const PRECO_USD_1M = {
  'claude-sonnet-4-6': { input: 3, output: 15, cached: 0.3 },
  'claude-opus-4-7': { input: 15, output: 75, cached: 1.5 },
  'gpt-4o': { input: 2.5, output: 10, cached: 1.25 },
  'text-embedding-3-small': { input: 0.02, output: 0, cached: 0.02 },
} as const

export function calcularCusto(
  modelo: string,
  inputTokens: number,
  outputTokens: number,
  cacheHit = false,
): number {
  const tabela = (
    PRECO_USD_1M as Record<string, { input: number; output: number; cached: number }>
  )[modelo]
  if (!tabela) return 0
  const inputPreco = cacheHit ? tabela.cached : tabela.input
  return (inputTokens * inputPreco + outputTokens * tabela.output) / 1_000_000
}

export async function registrarLLMCall(m: LLMCallMetricas): Promise<void> {
  try {
    await prisma.lLMCall.create({
      data: {
        funcao: m.funcao,
        modelo: m.modelo,
        versaoPrompt: m.versaoPrompt,
        cacheKey: m.cacheKey,
        cacheHit: m.cacheHit,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
        latenciaMs: m.latenciaMs,
        custoUsd: m.custoUsd,
        status: m.status,
        erro: m.erro,
        userId: m.userId,
      },
    })
  } catch {
    // best-effort logging
  }
}
