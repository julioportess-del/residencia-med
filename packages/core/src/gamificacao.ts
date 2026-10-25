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

/**
 * Requisitos extras por cinturão. XP mínimo é sempre obrigatório; os demais
 * só valem quando declarados aqui. Não ter o requisito = ficar "preso" na
 * faixa anterior mesmo com XP suficiente.
 */
export type RequisitosCinturao = {
  xpMin: number
  diasAtivosMin?: number
  respostasMin?: number
  taxaAcertoMin?: number // 0-1
  simuladosFinalizadosMin?: number
}

export const FAIXAS_CINTURAO: ReadonlyArray<{
  cinturao: Cinturao
  requisitos: RequisitosCinturao
}> = [
  { cinturao: 'BRONZE', requisitos: { xpMin: 0 } },
  {
    cinturao: 'PRATA',
    requisitos: { xpMin: 500, diasAtivosMin: 7, respostasMin: 100 },
  },
  {
    cinturao: 'OURO',
    requisitos: { xpMin: 2000, diasAtivosMin: 21, respostasMin: 400, taxaAcertoMin: 0.5 },
  },
  {
    cinturao: 'ESMERALDA',
    requisitos: {
      xpMin: 5000,
      diasAtivosMin: 45,
      respostasMin: 1000,
      taxaAcertoMin: 0.6,
      simuladosFinalizadosMin: 3,
    },
  },
  {
    cinturao: 'PLATINA',
    requisitos: {
      xpMin: 10000,
      diasAtivosMin: 90,
      respostasMin: 2500,
      taxaAcertoMin: 0.65,
      simuladosFinalizadosMin: 10,
    },
  },
  {
    cinturao: 'DIAMANTE',
    requisitos: {
      xpMin: 20000,
      diasAtivosMin: 150,
      respostasMin: 5000,
      taxaAcertoMin: 0.7,
      simuladosFinalizadosMin: 20,
    },
  },
]

export type EstatisticasUsuario = {
  respostas: number
  revisoes: number
  flashcards: number
  simuladosFinalizados: number
  diasAtivos?: number
  taxaAcerto?: number // 0-1
}

export function calcularXp(stats: EstatisticasUsuario): number {
  return (
    stats.respostas * PESOS_XP.resposta +
    stats.revisoes * PESOS_XP.revisao +
    stats.flashcards * PESOS_XP.flashcard +
    stats.simuladosFinalizados * PESOS_XP.simuladoFinalizado
  )
}

/**
 * Verifica se os requisitos de uma faixa foram cumpridos. Requisitos
 * ausentes nas stats são tratados como 0 (bloqueia o avanço).
 */
export function requisitosFaltantes(
  xp: number,
  stats: EstatisticasUsuario,
  req: RequisitosCinturao,
): Array<{ chave: string; atual: number; necessario: number; rotulo: string }> {
  const faltas: Array<{ chave: string; atual: number; necessario: number; rotulo: string }> = []
  if (xp < req.xpMin) {
    faltas.push({ chave: 'xp', atual: xp, necessario: req.xpMin, rotulo: 'XP acumulado' })
  }
  if (req.diasAtivosMin !== undefined) {
    const atual = stats.diasAtivos ?? 0
    if (atual < req.diasAtivosMin) {
      faltas.push({
        chave: 'diasAtivos',
        atual,
        necessario: req.diasAtivosMin,
        rotulo: 'Dias ativos (com respostas)',
      })
    }
  }
  if (req.respostasMin !== undefined) {
    if (stats.respostas < req.respostasMin) {
      faltas.push({
        chave: 'respostas',
        atual: stats.respostas,
        necessario: req.respostasMin,
        rotulo: 'Respostas totais',
      })
    }
  }
  if (req.taxaAcertoMin !== undefined) {
    const atual = stats.taxaAcerto ?? 0
    if (atual < req.taxaAcertoMin) {
      faltas.push({
        chave: 'taxaAcerto',
        atual: Math.round(atual * 100),
        necessario: Math.round(req.taxaAcertoMin * 100),
        rotulo: 'Taxa de acerto (%)',
      })
    }
  }
  if (req.simuladosFinalizadosMin !== undefined) {
    if (stats.simuladosFinalizados < req.simuladosFinalizadosMin) {
      faltas.push({
        chave: 'simuladosFinalizados',
        atual: stats.simuladosFinalizados,
        necessario: req.simuladosFinalizadosMin,
        rotulo: 'Simulados finalizados',
      })
    }
  }
  return faltas
}

/**
 * Cinturão alcançado considerando TODOS os requisitos (não só XP). Para
 * progredir pra faixa N, todos os requisitos de N precisam ser cumpridos.
 */
export function calcularCinturao(xp: number, stats?: EstatisticasUsuario): Cinturao {
  let atual: Cinturao = 'BRONZE'
  for (const faixa of FAIXAS_CINTURAO) {
    if (stats) {
      if (requisitosFaltantes(xp, stats, faixa.requisitos).length === 0) {
        atual = faixa.cinturao
      } else {
        break
      }
    } else {
      // Fallback legado: só XP
      if (xp >= faixa.requisitos.xpMin) atual = faixa.cinturao
      else break
    }
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
  requisitosFaltantes: Array<{
    chave: string
    atual: number
    necessario: number
    rotulo: string
  }>
}

export function progressoCinturao(xp: number, stats?: EstatisticasUsuario): ProgressoCinturao {
  const cinturao = calcularCinturao(xp, stats)
  const indiceAtual = FAIXAS_CINTURAO.findIndex((f) => f.cinturao === cinturao)
  const faixaAtual = FAIXAS_CINTURAO[indiceAtual]!
  const proximaFaixa = FAIXAS_CINTURAO[indiceAtual + 1] ?? null

  if (!proximaFaixa) {
    return {
      cinturao,
      xp,
      xpInicioFaixa: faixaAtual.requisitos.xpMin,
      xpProximaFaixa: null,
      progressoPct: 100,
      proximoCinturao: null,
      requisitosFaltantes: [],
    }
  }

  const span = proximaFaixa.requisitos.xpMin - faixaAtual.requisitos.xpMin
  const progresso = Math.max(
    0,
    Math.min(100, span > 0 ? ((xp - faixaAtual.requisitos.xpMin) / span) * 100 : 100),
  )

  return {
    cinturao,
    xp,
    xpInicioFaixa: faixaAtual.requisitos.xpMin,
    xpProximaFaixa: proximaFaixa.requisitos.xpMin,
    progressoPct: Math.round(progresso),
    proximoCinturao: proximaFaixa.cinturao,
    requisitosFaltantes: stats ? requisitosFaltantes(xp, stats, proximaFaixa.requisitos) : [],
  }
}
