/**
 * Logica do painel do estudante: meta diaria, visao semanal (seg-dom),
 * contagem regressiva da prova, prioridade de estudo e primeiros passos.
 *
 * Funcoes puras — o router so busca os dados e chama daqui.
 */

/** Brasil nao tem horario de verao desde 2019: UTC-3 fixo. */
const OFFSET_BRASILIA_MS = 3 * 60 * 60 * 1000
const DIA_MS = 24 * 60 * 60 * 1000

/** Metade do tempo em questoes, ~12 questoes/hora (com comentario) = 6 por hora de estudo. */
export const QUESTOES_POR_HORA_ESTUDO = 6
export const META_DIARIA_PADRAO = 20
export const META_DIARIA_MINIMA = 5

/** Abaixo disso a taxa de acerto e ruido — usa lacuna estimada. */
export const AMOSTRA_MINIMA_AREA = 5
/** Lacuna atribuida a area nunca/pouco treinada (levemente acima de 50% de erro). */
export const LACUNA_DESCONHECIDA = 0.6

const ROTULOS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

/** Data (YYYY-MM-DD) no fuso de Brasilia. */
export function chaveDiaBR(data: Date): string {
  return new Date(data.getTime() - OFFSET_BRASILIA_MS).toISOString().slice(0, 10)
}

function chaveParaUtc(chave: string): number {
  return Date.parse(`${chave}T00:00:00Z`)
}

function somarDias(chave: string, dias: number): string {
  return new Date(chaveParaUtc(chave) + dias * DIA_MS).toISOString().slice(0, 10)
}

export function metaDiariaQuestoes(cargaHorariaSemanal: number | null | undefined): number {
  if (!cargaHorariaSemanal || cargaHorariaSemanal <= 0) return META_DIARIA_PADRAO
  const meta = Math.round((cargaHorariaSemanal / 7) * QUESTOES_POR_HORA_ESTUDO)
  return Math.max(META_DIARIA_MINIMA, meta)
}

export function diasAteProva(dataProva: Date | null | undefined, hoje: Date): number | null {
  if (!dataProva) return null
  const diff = (chaveParaUtc(chaveDiaBR(dataProva)) - chaveParaUtc(chaveDiaBR(hoje))) / DIA_MS
  return Math.max(0, Math.round(diff))
}

export type RespostaDia = { createdAt: Date; correta: boolean }

export type DiaVisaoSemanal = {
  data: string
  rotulo: (typeof ROTULOS_SEMANA)[number]
  total: number
  acertos: number
  pctMeta: number
  ehHoje: boolean
  futuro: boolean
}

export type VisaoSemanal = {
  inicio: string
  fim: string
  dias: DiaVisaoSemanal[]
  totalSemana: number
  acertosSemana: number
  metaSemana: number
  pctSemana: number
}

function pct(valor: number, meta: number): number {
  if (meta <= 0) return 0
  return Math.min(100, Math.round((valor / meta) * 100))
}

export function visaoSemanal(
  respostas: readonly RespostaDia[],
  hoje: Date,
  metaDiaria: number,
): VisaoSemanal {
  const chaveHoje = chaveDiaBR(hoje)
  // getUTCDay: 0 = domingo. Converte para 0 = segunda.
  const idxHoje = (new Date(chaveParaUtc(chaveHoje)).getUTCDay() + 6) % 7
  const inicio = somarDias(chaveHoje, -idxHoje)

  const porDia = new Map<string, { total: number; acertos: number }>()
  for (const r of respostas) {
    const chave = chaveDiaBR(r.createdAt)
    const atual = porDia.get(chave) ?? { total: 0, acertos: 0 }
    porDia.set(chave, {
      total: atual.total + 1,
      acertos: atual.acertos + (r.correta ? 1 : 0),
    })
  }

  const dias = ROTULOS_SEMANA.map((rotulo, i): DiaVisaoSemanal => {
    const data = somarDias(inicio, i)
    const v = porDia.get(data) ?? { total: 0, acertos: 0 }
    return {
      data,
      rotulo,
      total: v.total,
      acertos: v.acertos,
      pctMeta: pct(v.total, metaDiaria),
      ehHoje: i === idxHoje,
      futuro: i > idxHoje,
    }
  })

  const totalSemana = dias.reduce((s, d) => s + d.total, 0)
  const acertosSemana = dias.reduce((s, d) => s + d.acertos, 0)
  const metaSemana = metaDiaria * 7

  return {
    inicio,
    fim: somarDias(inicio, 6),
    dias,
    totalSemana,
    acertosSemana,
    metaSemana,
    pctSemana: pct(totalSemana, metaSemana),
  }
}

export type AreaDesempenho = {
  id: string
  nome: string
  total: number
  acertos: number
  /** Peso da area na banca-alvo (qualquer escala: %, contagem). 0 = sem dado. */
  incidencia: number
}

export type ItemPrioridade = AreaDesempenho & {
  taxa: number | null
  amostraSuficiente: boolean
  pesoRelativo: number
  prioridade: number
}

/**
 * Ordena areas pela oportunidade de ganho: lacuna (1 - taxa de acerto)
 * multiplicada pelo peso relativo da area na banca-alvo.
 */
export function priorizarEstudo(areas: readonly AreaDesempenho[]): ItemPrioridade[] {
  const maxIncidencia = Math.max(0, ...areas.map((a) => a.incidencia))

  return areas
    .map((a): ItemPrioridade => {
      const amostraSuficiente = a.total >= AMOSTRA_MINIMA_AREA
      const taxa = a.total > 0 ? a.acertos / a.total : null
      const lacuna = amostraSuficiente && taxa !== null ? 1 - taxa : LACUNA_DESCONHECIDA
      const pesoRelativo = maxIncidencia > 0 ? a.incidencia / maxIncidencia : 1
      return { ...a, taxa, amostraSuficiente, pesoRelativo, prioridade: lacuna * pesoRelativo }
    })
    .sort((x, y) => y.prioridade - x.prioridade || y.incidencia - x.incidencia)
}

export type EstadoPrimeirosPassos = {
  onboardingCompleto: boolean
  totalRespostas: number
  totalRevisoes: number
  temPlano: boolean
  totalSimulados: number
}

export type PassoInicial = {
  id: 'onboarding' | 'plano' | 'questoes' | 'revisao' | 'simulado'
  titulo: string
  descricao: string
  href: string
  feito: boolean
}

export const QUESTOES_PRIMEIRO_TREINO = 10

export function primeirosPassos(estado: EstadoPrimeirosPassos): PassoInicial[] {
  return [
    {
      id: 'onboarding',
      titulo: 'Defina banca e data da prova',
      descricao: 'Personaliza metas, prioridades e contagem regressiva.',
      href: '/onboarding',
      feito: estado.onboardingCompleto,
    },
    {
      id: 'plano',
      titulo: 'Gere seu plano de estudo',
      descricao: 'Cronograma semanal adaptado ao seu tempo disponível.',
      href: '/plano',
      feito: estado.temPlano,
    },
    {
      id: 'questoes',
      titulo: `Responda ${QUESTOES_PRIMEIRO_TREINO} questões`,
      descricao: 'Calibra seu diagnóstico inicial por especialidade.',
      href: '/questoes',
      feito: estado.totalRespostas >= QUESTOES_PRIMEIRO_TREINO,
    },
    {
      id: 'revisao',
      titulo: 'Faça sua primeira revisão',
      descricao: 'Questões erradas voltam no tempo certo (repetição espaçada).',
      href: '/revisao',
      feito: estado.totalRevisoes > 0,
    },
    {
      id: 'simulado',
      titulo: 'Faça um simulado',
      descricao: 'Treine prova na íntegra com tempo cronometrado.',
      href: '/simulado',
      feito: estado.totalSimulados > 0,
    },
  ]
}
