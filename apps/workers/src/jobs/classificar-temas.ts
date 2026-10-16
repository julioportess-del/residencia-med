/**
 * Job: classifica questões publicadas sem tema primário num Tema existente.
 *
 * Padrão é DRY-RUN (não grava). Uso:
 *   pnpm --filter @residencia-med/workers classificar-temas -- --limite 20
 *   pnpm --filter @residencia-med/workers classificar-temas -- --aplicar
 *
 * Fonte de dados: Prisma (DATABASE_URL) por padrão, ou --entrada <json> com
 * { temas, questoes } exportados do banco. Com --saida-sql gera um INSERT
 * idempotente para aplicar por fora (ex.: `supabase db query --linked -f`).
 * --checkpoint <json> guarda as respostas da IA por questão e permite retomar.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { classificarTema, type ClassificacaoTema } from '@residencia-med/ai'
import {
  CONFIANCA_MINIMA_PADRAO,
  decidirClassificacao,
  indexarTaxonomia,
  linhasParaSql,
  resumirClassificacoes,
  type DecisaoClassificacao,
  type TemaTaxonomia,
} from '@residencia-med/core'
import { logger } from '../logger'

type QuestaoParaClassificar = {
  id: string
  enunciado: string
  enunciadoVignette: string | null
  alternativas: Array<{ letra: string; texto: string }>
}

type DadosEntrada = { temas: TemaTaxonomia[]; questoes: QuestaoParaClassificar[] }

type ItemRelatorio = {
  questaoId: string
  enunciado: string
  ia: ClassificacaoTema | null
  erro?: string
  decisao: DecisaoClassificacao | null
}

const TENTATIVAS = 3

async function carregarDoPrisma(limite: number | undefined): Promise<DadosEntrada> {
  const { prisma } = await import('@residencia-med/db')
  const temas = await prisma.tema.findMany({ include: { especialidade: true } })
  const questoes = await prisma.questao.findMany({
    where: { publicada: true, temas: { none: { primario: true } } },
    select: {
      id: true,
      enunciado: true,
      enunciadoVignette: true,
      alternativas: { select: { letra: true, texto: true }, orderBy: { ordem: 'asc' } },
    },
    orderBy: { id: 'asc' },
    take: limite,
  })
  return {
    temas: temas.map((t) => ({
      id: t.id,
      codigo: t.codigo,
      nome: t.nome,
      especialidade: t.especialidade.codigo,
    })),
    questoes,
  }
}

async function gravarNoPrisma(decisoes: DecisaoClassificacao[]): Promise<number> {
  const { prisma } = await import('@residencia-med/db')
  const linhas = decisoes.flatMap((d) => (d.aceita ? d.linhas : []))
  const { count } = await prisma.questaoTema.createMany({ data: linhas, skipDuplicates: true })
  return count
}

async function comRetentativa<T>(fn: () => Promise<T>): Promise<T> {
  let ultimoErro: unknown
  for (let i = 0; i < TENTATIVAS; i++) {
    try {
      return await fn()
    } catch (e) {
      ultimoErro = e
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
    }
  }
  throw ultimoErro
}

async function emParalelo<T, R>(
  itens: T[],
  concorrencia: number,
  fn: (item: T, indice: number) => Promise<R>,
): Promise<R[]> {
  const resultados: R[] = new Array(itens.length)
  let proximo = 0
  const trabalhadores = Array.from({ length: Math.min(concorrencia, itens.length) }, async () => {
    while (proximo < itens.length) {
      const i = proximo++
      resultados[i] = await fn(itens[i] as T, i)
    }
  })
  await Promise.all(trabalhadores)
  return resultados
}

function lerCheckpoint(caminho: string | undefined): Record<string, ClassificacaoTema> {
  if (!caminho || !existsSync(caminho)) return {}
  return JSON.parse(readFileSync(caminho, 'utf8')) as Record<string, ClassificacaoTema>
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      limite: { type: 'string' },
      aplicar: { type: 'boolean', default: false },
      entrada: { type: 'string' },
      'saida-sql': { type: 'string' },
      relatorio: { type: 'string' },
      checkpoint: { type: 'string' },
      concorrencia: { type: 'string', default: '4' },
      confianca: { type: 'string', default: String(CONFIANCA_MINIMA_PADRAO) },
    },
  })

  const limite = values.limite ? Number(values.limite) : undefined
  const confiancaMinima = Number(values.confianca)
  const concorrencia = Math.max(1, Number(values.concorrencia))

  const dados: DadosEntrada = values.entrada
    ? (JSON.parse(readFileSync(values.entrada, 'utf8')) as DadosEntrada)
    : await carregarDoPrisma(limite)
  const questoes = limite ? dados.questoes.slice(0, limite) : dados.questoes
  const taxonomia = indexarTaxonomia(dados.temas)
  const temasDisponiveis = dados.temas.map(({ codigo, nome, especialidade }) => ({
    codigo,
    nome,
    especialidade,
  }))

  const checkpoint = lerCheckpoint(values.checkpoint)
  let feitos = 0

  logger.info(
    { questoes: questoes.length, temas: dados.temas.length, dryRun: !values.aplicar },
    'classificar-temas: iniciando',
  )

  const itens = await emParalelo(questoes, concorrencia, async (q): Promise<ItemRelatorio> => {
    const base = { questaoId: q.id, enunciado: q.enunciado.slice(0, 300) }
    try {
      const ia =
        checkpoint[q.id] ??
        (await comRetentativa(() =>
          classificarTema({
            enunciado: q.enunciado,
            vignette: q.enunciadoVignette ?? undefined,
            alternativas: q.alternativas,
            temasDisponiveis,
          }),
        ))
      checkpoint[q.id] = ia
      const decisao = decidirClassificacao(q.id, ia, taxonomia, confiancaMinima)
      return { ...base, ia, decisao }
    } catch (e) {
      const erro = e instanceof Error ? e.message : String(e)
      logger.warn({ questaoId: q.id, erro }, 'classificar-temas: falha na IA')
      return { ...base, ia: null, erro, decisao: null }
    } finally {
      feitos += 1
      if (feitos % 25 === 0) {
        logger.info({ feitos, total: questoes.length }, 'classificar-temas: progresso')
        if (values.checkpoint) writeFileSync(values.checkpoint, JSON.stringify(checkpoint))
      }
    }
  })

  if (values.checkpoint) writeFileSync(values.checkpoint, JSON.stringify(checkpoint))

  const decisoes = itens.flatMap((i) => (i.decisao ? [i.decisao] : []))
  const resumo = { ...resumirClassificacoes(decisoes), errosIA: itens.length - decisoes.length }

  if (values.relatorio) writeFileSync(values.relatorio, JSON.stringify({ resumo, itens }, null, 2))
  if (values['saida-sql']) {
    writeFileSync(
      values['saida-sql'],
      linhasParaSql(decisoes.flatMap((d) => (d.aceita ? d.linhas : []))),
    )
  }

  let gravadas = 0
  if (values.aplicar && !values.entrada) gravadas = await gravarNoPrisma(decisoes)

  logger.info({ resumo, linhasGravadas: gravadas }, 'classificar-temas: concluído')
  process.exit(0)
}

main().catch((e: unknown) => {
  logger.error(
    { erro: e instanceof Error ? e.message : String(e) },
    'classificar-temas: erro fatal',
  )
  process.exit(1)
})
