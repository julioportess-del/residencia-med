/**
 * Calculo de incidencia de tema por banca.
 *
 * Entrada: lista de questoes da banca em uma janela (ex: 10 anos),
 * cada questao com seus temas + peso (primario=1.0, secundario=0.3).
 *
 * Saida: ranking ponderado por tema, com porcentagem e tendencia
 * vs janela anterior.
 *
 * Doc: docs/ARCHITECTURE.md secao 5.2 e 6.
 */

export type QuestaoIncidencia = {
  questaoId: string
  ano: number
  temas: Array<{ temaId: string; peso: number }>
}

export type IncidenciaTema = {
  temaId: string
  totalPonderado: number
  totalQuestoes: number
  porcentagem: number
}

export function calcularIncidencia(
  questoes: QuestaoIncidencia[],
  anoMin: number,
  anoMax: number,
): IncidenciaTema[] {
  const filtradas = questoes.filter((q) => q.ano >= anoMin && q.ano <= anoMax)
  const totalPonderadoBanca = filtradas.reduce(
    (acc, q) => acc + q.temas.reduce((s, t) => s + t.peso, 0),
    0,
  )

  const porTema = new Map<string, { ponderado: number; questoes: Set<string> }>()

  for (const q of filtradas) {
    for (const t of q.temas) {
      const ent = porTema.get(t.temaId) ?? { ponderado: 0, questoes: new Set<string>() }
      ent.ponderado += t.peso
      ent.questoes.add(q.questaoId)
      porTema.set(t.temaId, ent)
    }
  }

  return Array.from(porTema.entries())
    .map(([temaId, ent]) => ({
      temaId,
      totalPonderado: ent.ponderado,
      totalQuestoes: ent.questoes.size,
      porcentagem: totalPonderadoBanca > 0 ? (ent.ponderado / totalPonderadoBanca) * 100 : 0,
    }))
    .sort((a, b) => b.porcentagem - a.porcentagem)
}

export function calcularTendencia(
  atual: IncidenciaTema[],
  anterior: IncidenciaTema[],
): Map<string, number> {
  const tendencias = new Map<string, number>()
  const anteriorMap = new Map(anterior.map((i) => [i.temaId, i.porcentagem]))
  for (const i of atual) {
    const ant = anteriorMap.get(i.temaId) ?? 0
    tendencias.set(i.temaId, i.porcentagem - ant)
  }
  return tendencias
}
