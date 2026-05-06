import type { Dificuldade } from './schemas'

export type DesempenhoTema = {
  temaId: string
  temaNome: string
  total: number
  acertos: number
  taxa: number
  ultimaResposta: Date | null
}

export type RankingTema = {
  temaId: string
  temaNome: string
  especialidade: string
  porcentagemBanca: number
  tendencia: number
  desempenhoUsuario: number | null
  prioridade: number
}

export type ResultadoSimulado = {
  sessaoId: string
  total: number
  acertos: number
  erros: number
  tempoTotal: number
  porEspecialidade: Array<{
    especialidade: string
    total: number
    acertos: number
    taxa: number
  }>
  porDificuldade: Record<Dificuldade, { total: number; acertos: number }>
}

export type CorrecaoQuestao = {
  questaoId: string
  correta: boolean
  gabaritoLetra: string
  alternativaEscolhidaLetra: string
  explicacaoMd: string
  explicacaoErrosMd?: Record<string, string>
  guidelines: Array<{ titulo: string; fonte: string; url?: string; trecho?: string }>
}
