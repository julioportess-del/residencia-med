/**
 * Job: transforma o `relatorio.json` de um lote (lote-ia) em SQL idempotente
 * para gravar no banco:
 *   1. temas da TAXONOMIA_R1 que ainda não existem (por código);
 *   2. comentário gerado por IA em cada questão (rotulado na UI até revisão);
 *   3. classificação por tema (origem IA) só nas questões ainda sem tema.
 *
 * Nunca altera o gabarito oficial: divergência da IA vira `gabaritoContestadoIa`.
 *
 * Uso:
 *   pnpm lote-ia-sql --dir ~/Documents/residencia-med-ia/lote-amrigs
 *   supabase db query --linked -f <dir>/gravar.sql
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import {
  MODELO_COMENTARIO_LOTE,
  VERSAO_COMENTAR_QUESTAO,
  type ComentarioQuestao,
} from '@residencia-med/ai'
import { TAXONOMIA_R1, type DecisaoClassificacao, type TemaTaxonomiaR1 } from '@residencia-med/core'
import { logger } from '../logger'

export type ItemGravacao = {
  questao: { id: string }
  comentario: ComentarioQuestao | null
  classificacao: DecisaoClassificacao | null
}

const TAG = '$ia$'

function texto(valor: string): string {
  if (valor.includes(TAG)) return `'${valor.replace(/'/g, "''")}'`
  return `${TAG}${valor}${TAG}`
}

export function sqlTemas(temas: readonly TemaTaxonomiaR1[]): string {
  const valores = temas
    .map(
      (t) =>
        `(${texto(t.codigo)}, ${texto(t.nome)}, ${texto(t.especialidade)}, ${t.pai ? texto(t.pai) : 'NULL'})`,
    )
    .join(',\n')
  return `WITH tx(codigo, nome, esp, pai) AS (VALUES\n${valores}\n)
INSERT INTO "Tema" (id, codigo, nome, "especialidadeId", profundidade)
SELECT 'tema_' || lower(tx.codigo), tx.codigo, tx.nome, e.id, CASE WHEN tx.pai IS NULL THEN 0 ELSE 1 END
FROM tx JOIN "Especialidade" e ON e.codigo = tx.esp
WHERE NOT EXISTS (SELECT 1 FROM "Tema" t WHERE t.codigo = tx.codigo)
ON CONFLICT DO NOTHING;
WITH tx(codigo, pai) AS (VALUES\n${temas
    .filter((t) => t.pai)
    .map((t) => `(${texto(t.codigo)}, ${texto(t.pai ?? '')})`)
    .join(',\n')}\n)
UPDATE "Tema" t SET "parentId" = p.id
FROM tx JOIN "Tema" p ON p.codigo = tx.pai
WHERE t.codigo = tx.codigo AND t."parentId" IS NULL;`
}

export function sqlComentario(questaoId: string, c: ComentarioQuestao): string {
  return `UPDATE "Questao" SET
  "comentarioIa" = ${texto(JSON.stringify(c))}::jsonb,
  "comentarioIaModelo" = ${texto(MODELO_COMENTARIO_LOTE)},
  "comentarioIaVersao" = ${texto(VERSAO_COMENTAR_QUESTAO)},
  "comentarioIaEm" = now(),
  "comentarioIaRevisado" = false,
  "gabaritoContestadoIa" = ${c.gabaritoConcorda ? 'false' : 'true'},
  "updatedAt" = now()
WHERE id = ${texto(questaoId)};`
}

export function sqlClassificacao(d: Extract<DecisaoClassificacao, { aceita: true }>): string {
  // Os ids da taxonomia no relatório são os códigos; o id real vem do banco.
  const valores = d.linhas
    .map(
      (l) =>
        `(${texto(l.questaoId)}, ${texto(l.temaId)}, ${l.peso}, ${l.primario}, ${d.confianca})`,
    )
    .join(',\n')
  return `INSERT INTO "QuestaoTema" ("questaoId", "temaId", peso, primario, origem, confianca)
SELECT v.q, t.id, v.peso, v.primario, 'IA', v.conf
FROM (VALUES\n${valores}\n) AS v(q, codigo, peso, primario, conf)
JOIN "Tema" t ON t.codigo = v.codigo
WHERE NOT EXISTS (SELECT 1 FROM "QuestaoTema" qt WHERE qt."questaoId" = v.q AND qt.origem <> 'IA')
ON CONFLICT ("questaoId", "temaId") DO NOTHING;`
}

export function montarSqlGravacao(itens: ItemGravacao[]): string {
  const partes = ['BEGIN;', sqlTemas(TAXONOMIA_R1)]
  for (const it of itens) {
    if (it.comentario) partes.push(sqlComentario(it.questao.id, it.comentario))
    if (it.classificacao?.aceita) partes.push(sqlClassificacao(it.classificacao))
  }
  partes.push('COMMIT;')
  return partes.join('\n\n')
}

function main(): void {
  const { values } = parseArgs({ options: { dir: { type: 'string' } } })
  if (!values.dir) throw new Error('Use --dir <pasta do lote>')
  const { itens } = JSON.parse(readFileSync(join(values.dir, 'relatorio.json'), 'utf8')) as {
    itens: ItemGravacao[]
  }
  const sql = montarSqlGravacao(itens)
  const destino = join(values.dir, 'gravar.sql')
  writeFileSync(destino, sql)
  const comentarios = itens.filter((i) => i.comentario).length
  const classificadas = itens.filter((i) => i.classificacao?.aceita).length
  logger.info(
    { questoes: itens.length, comentarios, classificadas, destino },
    'gravar-lote-ia: SQL gerado',
  )
}

if (process.argv[1]?.endsWith('gravar-lote-ia.ts')) main()
