import { addDays, differenceInWeeks, startOfWeek } from 'date-fns'

/**
 * Gerador de plano de estudo.
 *
 * Pondera temas por (incidencia da banca * tendencia * 1/desempenho_usuario).
 * Distribui blocos pela carga horaria semanal:
 *   60% questoes em temas top
 *   25% revisao (puxa items SM-2 vencidos)
 *   10% simulado (semanal)
 *    5% teoria (so quando desempenho < 50% no tema)
 *
 * Doc: docs/ARCHITECTURE.md secao 5.2
 */

export type TemaCandidato = {
  temaId: string
  porcentagemBanca: number
  tendencia: number
  desempenhoUsuario: number | null
  nomeTema: string
}

export type BlocoPlano = {
  semana: number
  diaSemana: number
  ordem: number
  duracaoMin: number
  tipo: 'TEORIA' | 'QUESTOES' | 'REVISAO' | 'SIMULADO'
  temaId?: string
  titulo: string
  descricao?: string
}

export type ConfigPlano = {
  cargaHorariaSemanal: number
  dataProva: Date
  inicio?: Date
  diasEstudoSemana?: number[]
}

const DURACAO_BLOCO_MIN = 45

export function priorizarTemas(temas: TemaCandidato[]): TemaCandidato[] {
  return [...temas].sort((a, b) => prioridade(b) - prioridade(a))
}

function prioridade(t: TemaCandidato): number {
  const peso = t.porcentagemBanca * (1 + Math.max(t.tendencia, 0) / 10)
  const fatorDesempenho = t.desempenhoUsuario === null ? 1.2 : 1 + (1 - t.desempenhoUsuario)
  return peso * fatorDesempenho
}

export function gerarPlano(temasRanqueados: TemaCandidato[], cfg: ConfigPlano): BlocoPlano[] {
  const inicio = cfg.inicio ?? startOfWeek(new Date(), { weekStartsOn: 1 })
  const semanas = Math.max(1, differenceInWeeks(cfg.dataProva, inicio))
  const dias = cfg.diasEstudoSemana ?? [1, 2, 3, 4, 5, 6]

  const minutosPorDia = Math.round((cfg.cargaHorariaSemanal * 60) / dias.length)
  const blocosPorDia = Math.max(1, Math.floor(minutosPorDia / DURACAO_BLOCO_MIN))

  const blocos: BlocoPlano[] = []
  const topTemas = temasRanqueados.slice(0, Math.max(10, Math.min(30, temasRanqueados.length)))

  for (let s = 0; s < semanas; s++) {
    let temaIdx = 0
    for (const dia of dias) {
      for (let b = 0; b < blocosPorDia; b++) {
        const tipo = decidirTipo(b, blocosPorDia, dia)
        const tema = topTemas[temaIdx % topTemas.length]
        const titulo = construirTitulo(tipo, tema?.nomeTema)
        blocos.push({
          semana: s,
          diaSemana: dia,
          ordem: b,
          duracaoMin: DURACAO_BLOCO_MIN,
          tipo,
          temaId: tipo === 'SIMULADO' || tipo === 'REVISAO' ? undefined : tema?.temaId,
          titulo,
        })
        if (tipo === 'QUESTOES' || tipo === 'TEORIA') temaIdx++
      }
    }
  }
  return blocos
}

function decidirTipo(b: number, blocosPorDia: number, dia: number): BlocoPlano['tipo'] {
  if (dia === 6 && b === blocosPorDia - 1) return 'SIMULADO'
  if (b === 0) return 'REVISAO'
  if (b === blocosPorDia - 1) return 'TEORIA'
  return 'QUESTOES'
}

function construirTitulo(tipo: BlocoPlano['tipo'], tema?: string): string {
  switch (tipo) {
    case 'SIMULADO':
      return 'Simulado da semana'
    case 'REVISAO':
      return 'Revisao espacada'
    case 'TEORIA':
      return tema ? `Teoria: ${tema}` : 'Teoria'
    case 'QUESTOES':
      return tema ? `Questoes: ${tema}` : 'Questoes'
  }
}

export function dataDoBloco(bloco: BlocoPlano, inicioPlano: Date): Date {
  const semana = startOfWeek(addDays(inicioPlano, bloco.semana * 7), { weekStartsOn: 1 })
  return addDays(semana, bloco.diaSemana - 1)
}
