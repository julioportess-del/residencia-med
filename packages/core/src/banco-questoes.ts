/**
 * Banco de questões: situação de cada questão para o estudante (inédita,
 * errada, acerto no chute…), listas inteligentes e embaralhamento justo.
 * Lógica pura — o router busca o histórico e traduz a restrição em query.
 */

export type ConfiancaResposta = 'CHUTE' | 'INCERTO' | 'CONFIANTE' | null

export type RespostaHistorico = {
  questaoId: string
  correta: boolean
  confianca: ConfiancaResposta
  createdAt: Date
}

export type ResumoQuestao = {
  tentativas: number
  ultimaCorreta: boolean
  ultimaConfianca: ConfiancaResposta
  ultimaEm: Date
  jaErrou: boolean
}

export const SITUACOES = [
  'TODAS',
  'INEDITAS',
  'RESPONDIDAS',
  'ERRADAS',
  'ACERTADAS',
  'CHUTES_CERTOS',
  'CERTEZA_ERRADA',
  'REVISAO_VENCIDA',
] as const

export type SituacaoQuestao = (typeof SITUACOES)[number]

export function resumirHistorico(
  respostas: readonly RespostaHistorico[],
): Map<string, ResumoQuestao> {
  const ordenadas = [...respostas].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const mapa = new Map<string, ResumoQuestao>()
  for (const r of ordenadas) {
    const anterior = mapa.get(r.questaoId)
    mapa.set(r.questaoId, {
      tentativas: (anterior?.tentativas ?? 0) + 1,
      ultimaCorreta: r.correta,
      ultimaConfianca: r.confianca,
      ultimaEm: r.createdAt,
      jaErrou: (anterior?.jaErrou ?? false) || !r.correta,
    })
  }
  return mapa
}

export type RestricaoIds =
  | { tipo: 'nenhuma' }
  | { tipo: 'incluir'; ids: string[] }
  | { tipo: 'excluir'; ids: string[] }

function filtrar(historico: Map<string, ResumoQuestao>, cond: (r: ResumoQuestao) => boolean) {
  return [...historico.entries()].filter(([, r]) => cond(r)).map(([id]) => id)
}

export function restricaoPorSituacao(
  situacao: SituacaoQuestao,
  historico: Map<string, ResumoQuestao>,
  idsRevisaoVencida: readonly string[],
): RestricaoIds {
  switch (situacao) {
    case 'TODAS':
      return { tipo: 'nenhuma' }
    case 'INEDITAS':
      return { tipo: 'excluir', ids: [...historico.keys()] }
    case 'RESPONDIDAS':
      return { tipo: 'incluir', ids: [...historico.keys()] }
    case 'ERRADAS':
      return { tipo: 'incluir', ids: filtrar(historico, (r) => !r.ultimaCorreta) }
    case 'ACERTADAS':
      return { tipo: 'incluir', ids: filtrar(historico, (r) => r.ultimaCorreta) }
    case 'CHUTES_CERTOS':
      return {
        tipo: 'incluir',
        ids: filtrar(historico, (r) => r.ultimaCorreta && r.ultimaConfianca === 'CHUTE'),
      }
    case 'CERTEZA_ERRADA':
      return {
        tipo: 'incluir',
        ids: filtrar(historico, (r) => !r.ultimaCorreta && r.ultimaConfianca === 'CONFIANTE'),
      }
    case 'REVISAO_VENCIDA':
      return { tipo: 'incluir', ids: [...idsRevisaoVencida] }
  }
}

export type ListaInteligente = {
  id: string
  titulo: string
  descricao: string
  situacao: SituacaoQuestao
  /** Restringe às bancas-alvo do estudante. */
  somenteBancaAlvo: boolean
}

export const LISTAS_INTELIGENTES: readonly ListaInteligente[] = [
  {
    id: 'ineditas-alvo',
    titulo: 'Inéditas da minha banca',
    descricao: 'Questões oficiais da banca-alvo que você nunca respondeu.',
    situacao: 'INEDITAS',
    somenteBancaAlvo: true,
  },
  {
    id: 'revisao-vencida',
    titulo: 'Revisões vencidas',
    descricao: 'Questões que a repetição espaçada marcou para hoje.',
    situacao: 'REVISAO_VENCIDA',
    somenteBancaAlvo: false,
  },
  {
    id: 'meus-erros',
    titulo: 'Meus erros',
    descricao: 'Questões cuja última tentativa foi errada.',
    situacao: 'ERRADAS',
    somenteBancaAlvo: false,
  },
  {
    id: 'certeza-errada',
    titulo: 'Errei com certeza',
    descricao: 'Possíveis falsas compreensões — as que mais merecem revisão.',
    situacao: 'CERTEZA_ERRADA',
    somenteBancaAlvo: false,
  },
  {
    id: 'chutes',
    titulo: 'Acertei no chute',
    descricao: 'Acertos que ainda não contam como domínio.',
    situacao: 'CHUTES_CERTOS',
    somenteBancaAlvo: false,
  },
]

/** Fisher–Yates: permutação uniforme, sem mutar a entrada. */
export function embaralhar<T>(itens: readonly T[], rng: () => number = Math.random): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = copia[i] as T
    copia[i] = copia[j] as T
    copia[j] = tmp
  }
  return copia
}
