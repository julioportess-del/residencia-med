/**
 * Plano do dia: distribui os minutos disponíveis entre revisões vencidas,
 * erros a refazer e questões inéditas. Calculado só a partir dos dados reais.
 */

export type ModoEstudo = 'RAPIDO' | 'PADRAO' | 'APROFUNDADO'

export const MINUTOS_POR_MODO: Record<ModoEstudo, number> = {
  RAPIDO: 10,
  PADRAO: 40,
  APROFUNDADO: 90,
}

/** Tempo médio por item, incluindo ler a correção comentada. */
export const MINUTOS_POR_ITEM = { REVISOES: 2, ERROS: 3, INEDITAS: 3 } as const

/** Fração máxima do tempo para revisões e para erros (o resto é questão nova). */
const FRACAO_MAX_REVISOES = 0.4
const FRACAO_MAX_ERROS = 0.2

export type TipoTarefa = keyof typeof MINUTOS_POR_ITEM

export type TarefaDia = { tipo: TipoTarefa; quantidade: number; minutos: number }

export type EntradaPlanoDia = {
  minutos: number
  revisoesPendentes: number
  errosAbertos: number
  ineditasDisponiveis: number
}

function alocar(tipo: TipoTarefa, orcamento: number, disponivel: number): TarefaDia | null {
  const quantidade = Math.min(disponivel, Math.floor(orcamento / MINUTOS_POR_ITEM[tipo]))
  if (quantidade <= 0) return null
  return { tipo, quantidade, minutos: quantidade * MINUTOS_POR_ITEM[tipo] }
}

export function planejarDia(entrada: EntradaPlanoDia): { tarefas: TarefaDia[]; minutos: number } {
  const tarefas: TarefaDia[] = []
  let restante = entrada.minutos

  const revisoes = alocar(
    'REVISOES',
    Math.min(restante, entrada.minutos * FRACAO_MAX_REVISOES),
    entrada.revisoesPendentes,
  )
  if (revisoes) {
    tarefas.push(revisoes)
    restante -= revisoes.minutos
  }

  const erros = alocar(
    'ERROS',
    Math.min(restante, entrada.minutos * FRACAO_MAX_ERROS),
    entrada.errosAbertos,
  )
  if (erros) {
    tarefas.push(erros)
    restante -= erros.minutos
  }

  const ineditas = alocar('INEDITAS', restante, entrada.ineditasDisponiveis)
  if (ineditas) tarefas.push(ineditas)

  return { tarefas, minutos: entrada.minutos }
}

const OFFSET_BRASILIA_H = 3

export function saudacao(agora: Date): 'Bom dia' | 'Boa tarde' | 'Boa noite' {
  const hora = (agora.getUTCHours() - OFFSET_BRASILIA_H + 24) % 24
  if (hora >= 5 && hora < 12) return 'Bom dia'
  if (hora >= 12 && hora < 18) return 'Boa tarde'
  return 'Boa noite'
}
