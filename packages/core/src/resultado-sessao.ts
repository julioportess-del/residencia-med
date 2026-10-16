/**
 * Análise do resultado de uma sessão (simulado ou estudo): em branco,
 * desempenho por área, dificuldade e confiança, e tempo por questão.
 */

export type RespostaSessao = {
  questaoId: string
  correta: boolean
  tempoSegundos: number
  confianca: 'CHUTE' | 'INCERTO' | 'CONFIANTE' | null
  area: string | null
  dificuldade: string
  respondidaEm: Date
}

export type Grupo = { chave: string; total: number; acertos: number; taxa: number }

export type AnaliseSessao = {
  planejadas: number
  respondidas: number
  emBranco: number
  acertos: number
  erros: number
  taxa: number
  tempoTotalSegundos: number
  tempoMedioSegundos: number
  porArea: Grupo[]
  porDificuldade: Grupo[]
  porConfianca: Grupo[]
  maisDemoradas: Array<{ questaoId: string; tempoSegundos: number; correta: boolean }>
}

const SEM_AREA = 'Não classificada'
const SEM_CONFIANCA = 'Não registrada'
const LIMITE_DEMORADAS = 5

function agrupar(respostas: RespostaSessao[], chave: (r: RespostaSessao) => string): Grupo[] {
  const mapa = new Map<string, { total: number; acertos: number }>()
  for (const r of respostas) {
    const k = chave(r)
    const atual = mapa.get(k) ?? { total: 0, acertos: 0 }
    mapa.set(k, { total: atual.total + 1, acertos: atual.acertos + (r.correta ? 1 : 0) })
  }
  return [...mapa.entries()]
    .map(([k, v]) => ({ chave: k, ...v, taxa: v.total > 0 ? v.acertos / v.total : 0 }))
    .sort((a, b) => a.taxa - b.taxa || b.total - a.total)
}

export function analisarSessao(
  questaoIds: readonly string[],
  respostas: readonly RespostaSessao[],
): AnaliseSessao {
  // Primeira resposta de cada questão (refazer depois não muda o resultado da sessão)
  const primeiras = new Map<string, RespostaSessao>()
  for (const r of [...respostas].sort(
    (a, b) => a.respondidaEm.getTime() - b.respondidaEm.getTime(),
  )) {
    if (!primeiras.has(r.questaoId)) primeiras.set(r.questaoId, r)
  }
  const validas = [...primeiras.values()]
  const acertos = validas.filter((r) => r.correta).length
  const tempoTotal = validas.reduce((s, r) => s + r.tempoSegundos, 0)

  return {
    planejadas: questaoIds.length,
    respondidas: validas.length,
    emBranco: Math.max(0, questaoIds.length - validas.length),
    acertos,
    erros: validas.length - acertos,
    taxa: validas.length > 0 ? acertos / validas.length : 0,
    tempoTotalSegundos: tempoTotal,
    tempoMedioSegundos: validas.length > 0 ? Math.round(tempoTotal / validas.length) : 0,
    porArea: agrupar(validas, (r) => r.area ?? SEM_AREA),
    porDificuldade: agrupar(validas, (r) => r.dificuldade),
    porConfianca: agrupar(validas, (r) => r.confianca ?? SEM_CONFIANCA),
    maisDemoradas: [...validas]
      .sort((a, b) => b.tempoSegundos - a.tempoSegundos)
      .slice(0, LIMITE_DEMORADAS)
      .map(({ questaoId, tempoSegundos, correta }) => ({ questaoId, tempoSegundos, correta })),
  }
}
