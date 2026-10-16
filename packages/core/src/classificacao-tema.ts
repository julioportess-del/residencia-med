/**
 * Mapeamento da classificação de tema (saída da IA) para linhas de QuestaoTema.
 *
 * A IA devolve códigos de tema em texto livre; aqui validamos contra a
 * taxonomia real, aplicamos o limiar de confiança e montamos o que será
 * gravado. Lógica pura — sem IA e sem banco — para ser testável.
 */

export const CONFIANCA_MINIMA_PADRAO = 0.6
export const PESO_PRIMARIO = 1.0
export const PESO_SECUNDARIO = 0.4
export const MAX_SECUNDARIOS = 2

export type TemaTaxonomia = {
  id: string
  codigo: string
  nome: string
  especialidade: string
}

export type SugestaoClassificacao = {
  codigoTema: string | null
  confianca: number
  secundarios?: string[]
  justificativa?: string
}

export type LinhaQuestaoTema = {
  questaoId: string
  temaId: string
  peso: number
  primario: boolean
}

export type MotivoRejeicao = 'SEM_TEMA_ADEQUADO' | 'CODIGO_INVALIDO' | 'CONFIANCA_BAIXA'

export type DecisaoClassificacao =
  | {
      aceita: true
      questaoId: string
      temaPrimario: TemaTaxonomia
      confianca: number
      linhas: LinhaQuestaoTema[]
    }
  | {
      aceita: false
      questaoId: string
      motivo: MotivoRejeicao
      codigoSugerido: string | null
      confianca: number
    }

export function normalizarCodigoTema(codigo: string): string {
  return codigo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
}

export function indexarTaxonomia(temas: TemaTaxonomia[]): Map<string, TemaTaxonomia> {
  return new Map(temas.map((t) => [normalizarCodigoTema(t.codigo), t]))
}

function limitarConfianca(valor: number): number {
  if (!Number.isFinite(valor)) return 0
  return Math.min(1, Math.max(0, valor))
}

export function decidirClassificacao(
  questaoId: string,
  sugestao: SugestaoClassificacao,
  taxonomia: Map<string, TemaTaxonomia>,
  confiancaMinima: number = CONFIANCA_MINIMA_PADRAO,
): DecisaoClassificacao {
  const confianca = limitarConfianca(sugestao.confianca)
  const codigoSugerido = sugestao.codigoTema?.trim() || null

  if (!codigoSugerido) {
    return { aceita: false, questaoId, motivo: 'SEM_TEMA_ADEQUADO', codigoSugerido, confianca }
  }

  const temaPrimario = taxonomia.get(normalizarCodigoTema(codigoSugerido))
  if (!temaPrimario) {
    return { aceita: false, questaoId, motivo: 'CODIGO_INVALIDO', codigoSugerido, confianca }
  }

  if (confianca < confiancaMinima) {
    return { aceita: false, questaoId, motivo: 'CONFIANCA_BAIXA', codigoSugerido, confianca }
  }

  const secundarios = (sugestao.secundarios ?? [])
    .map((c) => taxonomia.get(normalizarCodigoTema(c)))
    .filter((t): t is TemaTaxonomia => t !== undefined && t.id !== temaPrimario.id)
    .filter((t, i, lista) => lista.findIndex((o) => o.id === t.id) === i)
    .slice(0, MAX_SECUNDARIOS)

  const linhas: LinhaQuestaoTema[] = [
    { questaoId, temaId: temaPrimario.id, peso: PESO_PRIMARIO, primario: true },
    ...secundarios.map((t) => ({
      questaoId,
      temaId: t.id,
      peso: PESO_SECUNDARIO,
      primario: false,
    })),
  ]

  return { aceita: true, questaoId, temaPrimario, confianca, linhas }
}

export type ResumoClassificacao = {
  total: number
  aceitas: number
  rejeitadas: Record<MotivoRejeicao, number>
  porEspecialidade: Record<string, number>
}

export function resumirClassificacoes(decisoes: DecisaoClassificacao[]): ResumoClassificacao {
  const rejeitadas: Record<MotivoRejeicao, number> = {
    SEM_TEMA_ADEQUADO: 0,
    CODIGO_INVALIDO: 0,
    CONFIANCA_BAIXA: 0,
  }
  const porEspecialidade: Record<string, number> = {}
  let aceitas = 0

  for (const d of decisoes) {
    if (d.aceita) {
      aceitas += 1
      const esp = d.temaPrimario.especialidade
      porEspecialidade[esp] = (porEspecialidade[esp] ?? 0) + 1
    } else {
      rejeitadas[d.motivo] += 1
    }
  }

  return { total: decisoes.length, aceitas, rejeitadas, porEspecialidade }
}

/** SQL idempotente (ON CONFLICT DO NOTHING) para aplicar as linhas fora do Prisma. */
export function linhasParaSql(linhas: LinhaQuestaoTema[]): string {
  if (linhas.length === 0) return ''
  const esc = (s: string) => `'${s.replace(/'/g, "''")}'`
  const valores = linhas
    .map((l) => `(${esc(l.questaoId)}, ${esc(l.temaId)}, ${l.peso}, ${l.primario})`)
    .join(',\n')
  return `INSERT INTO "QuestaoTema" ("questaoId", "temaId", "peso", "primario") VALUES\n${valores}\nON CONFLICT ("questaoId", "temaId") DO NOTHING;`
}
