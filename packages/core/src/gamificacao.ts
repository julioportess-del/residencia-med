/**
 * Sistema de gamificação por cinturões. XP é derivado das atividades do
 * candidato (respostas, revisões, flashcards, simulados). Faixas lineares
 * para começar; podem virar curva assimptótica depois sem mudar o schema.
 */

export type Cinturao = 'BRONZE' | 'PRATA' | 'OURO' | 'ESMERALDA' | 'PLATINA' | 'DIAMANTE'

export const PESOS_XP = {
  resposta: 5,
  revisao: 2,
  flashcard: 1,
  simuladoFinalizado: 50,
} as const

/** Limiares em ordem crescente. Alterar aqui propaga para toda a UI. */
export const FAIXAS_CINTURAO: ReadonlyArray<{ cinturao: Cinturao; xpMin: number }> = [
  { cinturao: 'BRONZE', xpMin: 0 },
  { cinturao: 'PRATA', xpMin: 500 },
  { cinturao: 'OURO', xpMin: 2000 },
  { cinturao: 'ESMERALDA', xpMin: 5000 },
  { cinturao: 'PLATINA', xpMin: 10000 },
  { cinturao: 'DIAMANTE', xpMin: 20000 },
]

export type EstatisticasUsuario = {
  respostas: number
  revisoes: number
  flashcards: number
  simuladosFinalizados: number
}

export function calcularXp(stats: EstatisticasUsuario): number {
  return (
    stats.respostas * PESOS_XP.resposta +
    stats.revisoes * PESOS_XP.revisao +
    stats.flashcards * PESOS_XP.flashcard +
    stats.simuladosFinalizados * PESOS_XP.simuladoFinalizado
  )
}

export function calcularCinturao(xp: number): Cinturao {
  let atual: Cinturao = 'BRONZE'
  for (const faixa of FAIXAS_CINTURAO) {
    if (xp >= faixa.xpMin) atual = faixa.cinturao
    else break
  }
  return atual
}

export type ProgressoCinturao = {
  cinturao: Cinturao
  xp: number
  xpInicioFaixa: number
  xpProximaFaixa: number | null // null quando está no último (DIAMANTE)
  progressoPct: number // 0-100 dentro da faixa atual
  proximoCinturao: Cinturao | null
}

export function progressoCinturao(xp: number): ProgressoCinturao {
  const cinturao = calcularCinturao(xp)
  const indiceAtual = FAIXAS_CINTURAO.findIndex((f) => f.cinturao === cinturao)
  const faixaAtual = FAIXAS_CINTURAO[indiceAtual]!
  const proximaFaixa = FAIXAS_CINTURAO[indiceAtual + 1] ?? null

  if (!proximaFaixa) {
    return {
      cinturao,
      xp,
      xpInicioFaixa: faixaAtual.xpMin,
      xpProximaFaixa: null,
      progressoPct: 100,
      proximoCinturao: null,
    }
  }

  const span = proximaFaixa.xpMin - faixaAtual.xpMin
  const progresso = Math.max(0, Math.min(100, ((xp - faixaAtual.xpMin) / span) * 100))

  return {
    cinturao,
    xp,
    xpInicioFaixa: faixaAtual.xpMin,
    xpProximaFaixa: proximaFaixa.xpMin,
    progressoPct: Math.round(progresso),
    proximoCinturao: proximaFaixa.cinturao,
  }
}
