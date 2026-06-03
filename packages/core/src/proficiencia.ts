/**
 * Cálculo de proficiência ponderado por dificuldade.
 *
 * Cada questão tem peso conforme dificuldade:
 *   FACIL = 1, MEDIO = 2, DIFICIL = 3, MUITO_DIFICIL = 4
 *
 * Score por especialidade =
 *   sum(peso * acertos) / sum(peso * total) * 100
 *
 * Score global =
 *   média ponderada dos scores por especialidade pelo peso de exposição
 *   (mais respostas em uma especialidade = mais peso no global)
 *
 * Por que não percentual simples? Porque acertar 80% de questões fáceis
 * não é o mesmo que acertar 80% de questões difíceis. Estimativa de
 * preparo precisa refletir cobertura na dificuldade.
 */

import type { Dificuldade } from '@residencia-med/types'

const PESO_DIFICULDADE: Record<Dificuldade, number> = {
  FACIL: 1,
  MEDIO: 2,
  DIFICIL: 3,
  MUITO_DIFICIL: 4,
}

export type RespostaParaProficiencia = {
  correta: boolean
  dificuldade: Dificuldade
  especialidadeId: string
  especialidadeNome: string
}

export type ScoreEspecialidade = {
  especialidadeId: string
  nome: string
  score: number // 0-100
  total: number
  acertos: number
  pesoTotal: number // soma dos pesos das questões respondidas
}

export type ResultadoProficiencia = {
  scoreGlobal: number
  totalRespostas: number
  porEspecialidade: ScoreEspecialidade[]
}

export function calcularProficiencia(respostas: RespostaParaProficiencia[]): ResultadoProficiencia {
  if (respostas.length === 0) {
    return { scoreGlobal: 0, totalRespostas: 0, porEspecialidade: [] }
  }

  const grupos = new Map<
    string,
    { nome: string; acertosPond: number; totalPond: number; total: number; acertos: number }
  >()

  for (const r of respostas) {
    const peso = PESO_DIFICULDADE[r.dificuldade] ?? 1
    const ent = grupos.get(r.especialidadeId) ?? {
      nome: r.especialidadeNome,
      acertosPond: 0,
      totalPond: 0,
      total: 0,
      acertos: 0,
    }
    ent.totalPond += peso
    if (r.correta) ent.acertosPond += peso
    ent.total += 1
    if (r.correta) ent.acertos += 1
    grupos.set(r.especialidadeId, ent)
  }

  const porEspecialidade: ScoreEspecialidade[] = Array.from(grupos.entries()).map(([id, g]) => ({
    especialidadeId: id,
    nome: g.nome,
    score: g.totalPond > 0 ? (g.acertosPond / g.totalPond) * 100 : 0,
    total: g.total,
    acertos: g.acertos,
    pesoTotal: g.totalPond,
  }))

  // Score global: média ponderada pelo peso total de cada especialidade.
  // Penaliza quem só respondeu uma especialidade — ainda assim seu score
  // global será o mesmo dessa especialidade. A "ampliação de cobertura"
  // vai aparecer apenas se ele responder em outras com taxa diferente.
  const totalPesoGlobal = porEspecialidade.reduce((s, e) => s + e.pesoTotal, 0)
  const scoreGlobal =
    totalPesoGlobal > 0
      ? porEspecialidade.reduce((s, e) => s + e.score * e.pesoTotal, 0) / totalPesoGlobal
      : 0

  porEspecialidade.sort((a, b) => b.pesoTotal - a.pesoTotal)

  return {
    scoreGlobal: Math.round(scoreGlobal * 10) / 10,
    totalRespostas: respostas.length,
    porEspecialidade: porEspecialidade.map((e) => ({
      ...e,
      score: Math.round(e.score * 10) / 10,
    })),
  }
}
