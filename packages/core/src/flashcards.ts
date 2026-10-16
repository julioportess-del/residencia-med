/**
 * Flashcards com FSRS (ts-fsrs, MIT) — o algoritmo usado pelo Anki moderno.
 * Este módulo traduz o estado do ts-fsrs para o vocabulário do projeto e é a
 * única porta de entrada para agendar cartões.
 */
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type Grade,
} from 'ts-fsrs'

/** Probabilidade alvo de lembrar no dia da revisão (padrão do Anki). */
export const RETENCAO_PADRAO = 0.9

export type NotaFlashcard = 'ERREI' | 'DIFICIL' | 'BOM' | 'FACIL'
export type EstadoFsrs = 'NOVO' | 'APRENDENDO' | 'REVISAO' | 'REAPRENDENDO'

/** Estado persistido do cartão (espelha as colunas do banco). */
export type EstadoCartao = {
  vencimento: Date
  estabilidade: number
  dificuldade: number
  diasDecorridos: number
  diasAgendados: number
  passosAprendizado: number
  repeticoes: number
  lapsos: number
  estado: EstadoFsrs
  ultimaRevisao: Date | null
}

export type LogRevisao = {
  nota: NotaFlashcard
  estadoAntes: EstadoFsrs
  vencimentoAnterior: Date
  revisadoEm: Date
}

const NOTA_PARA_RATING: Record<NotaFlashcard, Grade> = {
  ERREI: Rating.Again,
  DIFICIL: Rating.Hard,
  BOM: Rating.Good,
  FACIL: Rating.Easy,
}

const STATE_PARA_ESTADO: Record<State, EstadoFsrs> = {
  [State.New]: 'NOVO',
  [State.Learning]: 'APRENDENDO',
  [State.Review]: 'REVISAO',
  [State.Relearning]: 'REAPRENDENDO',
}

const ESTADO_PARA_STATE: Record<EstadoFsrs, State> = {
  NOVO: State.New,
  APRENDENDO: State.Learning,
  REVISAO: State.Review,
  REAPRENDENDO: State.Relearning,
}

function agendador(retencao: number) {
  return fsrs(generatorParameters({ request_retention: retencao, enable_fuzz: true }))
}

function paraCard(c: EstadoCartao): Card {
  return {
    due: c.vencimento,
    stability: c.estabilidade,
    difficulty: c.dificuldade,
    elapsed_days: c.diasDecorridos,
    scheduled_days: c.diasAgendados,
    learning_steps: c.passosAprendizado,
    reps: c.repeticoes,
    lapses: c.lapsos,
    state: ESTADO_PARA_STATE[c.estado],
    ...(c.ultimaRevisao ? { last_review: c.ultimaRevisao } : {}),
  }
}

function deCard(card: Card): EstadoCartao {
  return {
    vencimento: card.due,
    estabilidade: card.stability,
    dificuldade: card.difficulty,
    diasDecorridos: card.elapsed_days,
    diasAgendados: card.scheduled_days,
    passosAprendizado: card.learning_steps,
    repeticoes: card.reps,
    lapsos: card.lapses,
    estado: STATE_PARA_ESTADO[card.state],
    ultimaRevisao: card.last_review ?? null,
  }
}

export function cartaoNovo(agora: Date): EstadoCartao {
  return deCard(createEmptyCard(agora))
}

export function revisarCartao(
  cartao: EstadoCartao,
  nota: NotaFlashcard,
  agora: Date,
  retencao: number = RETENCAO_PADRAO,
): { cartao: EstadoCartao; log: LogRevisao } {
  const { card } = agendador(retencao).next(paraCard(cartao), agora, NOTA_PARA_RATING[nota])
  return {
    cartao: deCard(card),
    log: {
      nota,
      estadoAntes: cartao.estado,
      vencimentoAnterior: cartao.vencimento,
      revisadoEm: agora,
    },
  }
}

/** Quando o cartão voltaria em cada resposta — para mostrar nos botões. */
export function preverIntervalos(
  cartao: EstadoCartao,
  agora: Date,
  retencao: number = RETENCAO_PADRAO,
): Record<NotaFlashcard, Date> {
  const f = agendador(retencao)
  const base = paraCard(cartao)
  return {
    ERREI: f.next(base, agora, Rating.Again).card.due,
    DIFICIL: f.next(base, agora, Rating.Hard).card.due,
    BOM: f.next(base, agora, Rating.Good).card.due,
    FACIL: f.next(base, agora, Rating.Easy).card.due,
  }
}

/** "10 min", "3 dias", "2 meses" — rótulo curto para o botão. */
export function rotuloIntervalo(de: Date, ate: Date): string {
  const min = Math.max(1, Math.round((ate.getTime() - de.getTime()) / 60_000))
  if (min < 60) return `${min} min`
  const horas = Math.round(min / 60)
  if (horas < 24) return `${horas} h`
  const dias = Math.round(horas / 24)
  if (dias < 31) return `${dias} ${dias === 1 ? 'dia' : 'dias'}`
  const meses = Math.round(dias / 30)
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  return `${Math.round(meses / 12)} a`
}
