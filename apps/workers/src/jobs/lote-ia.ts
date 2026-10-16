/**
 * Job: comenta (Opus 5.5) e classifica (Sonnet 5.5) questões oficiais via
 * Message Batches API (50% mais barata). NÃO grava no banco: produz um
 * relatório para revisão humana. A gravação é um passo separado, após aprovação.
 *
 * Uso:
 *   pnpm --filter @residencia-med/workers lote-ia -- --entrada amostra.json --dir saida/teste-20
 *
 * `--entrada`: JSON { questoes: QuestaoLote[] } exportado do banco.
 * `--dir`: pasta de trabalho. Se já houver `lote.json`, retoma o mesmo lote
 * (não reenvia e não cobra de novo).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import {
  calcularCusto,
  consultarLote,
  enviarLote,
  extrairComentario,
  extrairJsonClassificacao,
  lerResultadosLote,
  montarRequisicaoClassificacao,
  montarRequisicaoComentario,
  MODELO_CLASSIFICACAO_LOTE,
  MODELO_COMENTARIO_LOTE,
  type ComentarioQuestao,
  type ResultadoLote,
} from '@residencia-med/ai'
import {
  decidirClassificacao,
  grandeAreaDoTema,
  indexarTaxonomia,
  TAXONOMIA_R1,
  type DecisaoClassificacao,
} from '@residencia-med/core'
import { logger } from '../logger'

type QuestaoLote = {
  id: string
  banca: string
  ano: number
  enunciado: string
  enunciadoVignette: string | null
  gabaritoLetra: string
  fonte: string | null
  alternativas: Array<{ letra: string; texto: string }>
}

const INTERVALO_CONSULTA_MS = 30_000
const DESCONTO_LOTE = 0.5
const MAX_FALHAS_CONSULTA = 20

const temasDisponiveis = TAXONOMIA_R1.map(({ codigo, nome, especialidade }) => ({
  codigo,
  nome,
  especialidade,
}))
const taxonomia = indexarTaxonomia(TAXONOMIA_R1.map((t) => ({ ...t, id: t.codigo })))

function requisicoes(questoes: QuestaoLote[]) {
  return questoes.flatMap((q) => [
    montarRequisicaoClassificacao(q.id, {
      enunciado: q.enunciado,
      vignette: q.enunciadoVignette ?? undefined,
      alternativas: q.alternativas,
      temasDisponiveis,
    }),
    montarRequisicaoComentario(q.id, {
      banca: q.banca,
      ano: q.ano,
      enunciado: q.enunciado,
      vignette: q.enunciadoVignette,
      alternativas: q.alternativas,
      gabaritoLetra: q.gabaritoLetra,
    }),
  ])
}

async function aguardar(id: string): Promise<void> {
  let falhasSeguidas = 0
  for (;;) {
    try {
      const estado = await consultarLote(id)
      falhasSeguidas = 0
      logger.info({ lote: id, ...estado.contagem }, `lote-ia: ${estado.status}`)
      if (estado.status === 'ended') return
    } catch (e) {
      // Queda de rede não cancela o lote (ele segue na Anthropic): só tenta de novo.
      falhasSeguidas += 1
      logger.warn(
        { lote: id, falhasSeguidas, erro: e instanceof Error ? e.message : String(e) },
        'lote-ia: falha ao consultar, tentando de novo',
      )
      if (falhasSeguidas >= MAX_FALHAS_CONSULTA) throw e
    }
    await new Promise((r) => setTimeout(r, INTERVALO_CONSULTA_MS))
  }
}

type ItemRelatorio = {
  questao: QuestaoLote
  comentario: ComentarioQuestao | null
  erroComentario?: string
  classificacao: DecisaoClassificacao | null
  justificativaClassificacao?: string
  erroClassificacao?: string
}

function montarItens(questoes: QuestaoLote[], resultados: ResultadoLote[]): ItemRelatorio[] {
  const porId = new Map(resultados.map((r) => [r.customId, r]))
  return questoes.map((q) => {
    const item: ItemRelatorio = { questao: q, comentario: null, classificacao: null }
    const com = porId.get(`comentar-${q.id}`)
    try {
      if (!com?.ok) throw new Error(com?.erro ?? 'sem resultado')
      item.comentario = extrairComentario(
        com.texto,
        q.alternativas.map((a) => a.letra),
      )
    } catch (e) {
      item.erroComentario = e instanceof Error ? e.message : String(e)
    }
    const cla = porId.get(`classificar-${q.id}`)
    try {
      if (!cla?.ok) throw new Error(cla?.erro ?? 'sem resultado')
      const ia = extrairJsonClassificacao(cla.texto)
      item.justificativaClassificacao = ia.justificativa
      item.classificacao = decidirClassificacao(q.id, ia, taxonomia)
    } catch (e) {
      item.erroClassificacao = e instanceof Error ? e.message : String(e)
    }
    return item
  })
}

function custoUsd(resultados: ResultadoLote[]): { comentario: number; classificacao: number } {
  const soma = (prefixo: string, modelo: string) =>
    resultados
      .filter((r) => r.customId.startsWith(prefixo))
      .reduce((s, r) => s + calcularCusto(modelo, r.tokensEntrada, r.tokensSaida), 0) *
    DESCONTO_LOTE
  return {
    comentario: soma('comentar-', MODELO_COMENTARIO_LOTE),
    classificacao: soma('classificar-', MODELO_CLASSIFICACAO_LOTE),
  }
}

function nomeTema(d: DecisaoClassificacao | null): string {
  if (!d) return '—'
  if (!d.aceita)
    return `(rejeitada: ${d.motivo}${d.codigoSugerido ? ` · ${d.codigoSugerido}` : ''})`
  const area = grandeAreaDoTema({ especialidade: d.temaPrimario.especialidade })
  return `${area} › ${d.temaPrimario.nome} (${Math.round(d.confianca * 100)}%)`
}

function markdown(itens: ItemRelatorio[], custo: { comentario: number; classificacao: number }) {
  const linhas: string[] = [
    '# Teste de qualidade — comentários e classificação por IA',
    '',
    `Questões: ${itens.length} · Custo real deste teste (lote, -50%): US$ ${(custo.comentario + custo.classificacao).toFixed(4)}`,
    `Comentário: ${MODELO_COMENTARIO_LOTE} · Classificação: ${MODELO_CLASSIFICACAO_LOTE}`,
    '',
    '> Conteúdo GERADO POR IA, não revisado. Gabarito exibido é o OFICIAL da banca.',
    '',
  ]
  itens.forEach((it, i) => {
    const q = it.questao
    const c = it.comentario
    linhas.push(`## ${i + 1}. ${q.banca} ${q.ano} — gabarito oficial ${q.gabaritoLetra}`, '')
    if (q.enunciadoVignette) linhas.push(q.enunciadoVignette, '')
    linhas.push(q.enunciado, '')
    for (const a of q.alternativas) linhas.push(`- **${a.letra})** ${a.texto}`)
    linhas.push('', `**Tema:** ${nomeTema(it.classificacao)}`)
    if (it.justificativaClassificacao) linhas.push(`_${it.justificativaClassificacao}_`)
    if (it.erroClassificacao) linhas.push(`⚠️ Classificação falhou: ${it.erroClassificacao}`)
    linhas.push('')
    if (!c) {
      linhas.push(`⚠️ Comentário falhou: ${it.erroComentario ?? '?'}`, '', '---', '')
      return
    }
    if (!c.gabaritoConcorda) linhas.push(`🚩 **IA diverge do gabarito:** ${c.divergencia}`, '')
    if (c.dependeImagem) linhas.push('🖼️ Depende de imagem não fornecida.', '')
    linhas.push(`**Resumo:** ${c.resumo}`, '', `**Conceito principal:** ${c.conceitoPrincipal}`)
    if (c.pegadinha) linhas.push('', `**Pegadinha:** ${c.pegadinha}`)
    linhas.push('', '**Alternativas:**')
    for (const a of c.alternativas) linhas.push(`- **${a.letra})** ${a.comentario}`)
    linhas.push('', `**Referência:** ${c.referencia ?? '(nenhuma citada)'}`)
    linhas.push(`**Flashcard:** ${c.flashcard.frente} → ${c.flashcard.verso}`, '', '---', '')
  })
  return linhas.join('\n')
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      entrada: { type: 'string' },
      dir: { type: 'string' },
      limite: { type: 'string' },
    },
  })
  if (!values.entrada || !values.dir) throw new Error('Use --entrada <json> --dir <pasta>')
  mkdirSync(values.dir, { recursive: true })

  const { questoes: todas } = JSON.parse(readFileSync(values.entrada, 'utf8')) as {
    questoes: QuestaoLote[]
  }
  const questoes = values.limite ? todas.slice(0, Number(values.limite)) : todas

  const arquivoLote = join(values.dir, 'lote.json')
  let loteId: string
  if (existsSync(arquivoLote)) {
    loteId = (JSON.parse(readFileSync(arquivoLote, 'utf8')) as { id: string }).id
    logger.info({ loteId }, 'lote-ia: retomando lote existente (sem reenviar)')
  } else {
    const reqs = requisicoes(questoes)
    writeFileSync(join(values.dir, 'requisicoes.json'), JSON.stringify(reqs, null, 2))
    loteId = await enviarLote(reqs)
    writeFileSync(arquivoLote, JSON.stringify({ id: loteId, enviadoEm: new Date().toISOString() }))
    logger.info({ loteId, requisicoes: reqs.length }, 'lote-ia: lote enviado')
  }

  await aguardar(loteId)
  const resultados = await lerResultadosLote(loteId)
  writeFileSync(join(values.dir, 'resultados.json'), JSON.stringify(resultados, null, 2))

  const itens = montarItens(questoes, resultados)
  const custo = custoUsd(resultados)
  writeFileSync(join(values.dir, 'relatorio.json'), JSON.stringify({ custo, itens }, null, 2))
  writeFileSync(join(values.dir, 'relatorio.md'), markdown(itens, custo))

  const resumo = {
    questoes: itens.length,
    comentariosOk: itens.filter((i) => i.comentario).length,
    divergencias: itens.filter((i) => i.comentario && !i.comentario.gabaritoConcorda).length,
    classificadas: itens.filter((i) => i.classificacao?.aceita).length,
    custoUsd: Number((custo.comentario + custo.classificacao).toFixed(4)),
  }
  logger.info(resumo, 'lote-ia: concluído')
  process.exit(0)
}

main().catch((e: unknown) => {
  logger.error({ erro: e instanceof Error ? e.message : String(e) }, 'lote-ia: erro fatal')
  process.exit(1)
})
