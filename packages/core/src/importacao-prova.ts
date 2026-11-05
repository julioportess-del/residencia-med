/**
 * Fora do barril de @residencia-med/core (usa node:crypto): importar de
 * "@residencia-med/core/importacao-prova", só em código de servidor.
 *
 * Importacao de prova transcrita (JSON produzido a partir dos cadernos) para
 * Prova + Questao + Alternativa. Funcoes puras: validacao, normalizacao, hash
 * e geracao de SQL idempotente (aplicado por fora, ex.: `supabase db query`).
 */
import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'

const LETRAS = ['A', 'B', 'C', 'D', 'E'] as const
type Letra = (typeof LETRAS)[number]

const FiguraSchema = z.object({
  pagina: z.number().int().positive(),
  x0: z.number().min(0).max(1),
  y0: z.number().min(0).max(1),
  x1: z.number().min(0).max(1),
  y1: z.number().min(0).max(1),
  descricao: z.string().optional(),
})
export type FiguraTranscrita = z.infer<typeof FiguraSchema>

const QuestaoSchema = z.object({
  numero: z.number().int().positive(),
  enunciado: z.string().min(1),
  alternativas: z.record(z.string()),
  figuras: z.array(FiguraSchema).default([]),
  observacao: z.string().nullable().optional(),
})

export const ProvaTranscritaSchema = z.object({
  ano: z.number().int().min(2000).max(2100),
  totalQuestoes: z.number().int().positive(),
  gabarito: z.record(z.string().nullable()),
  anuladas: z.array(z.number().int()).default([]),
  questoes: z.array(QuestaoSchema).min(1),
})
export type ProvaTranscrita = z.infer<typeof ProvaTranscritaSchema>

export type QuestaoNormalizada = {
  numero: number
  enunciado: string
  alternativas: { letra: Letra; texto: string }[]
  /** null = anulada ou sem gabarito: importa despublicada. */
  gabarito: Letra | null
  figuras: FiguraTranscrita[]
  hash: string
}

export type ResultadoValidacao = {
  questoes: QuestaoNormalizada[]
  erros: string[]
  avisos: string[]
}

/** Mesma normalizacao do seed: hash estavel entre importacoes (Questao.hash e UNIQUE). */
export function normalizarTexto(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
}

export function hashEnunciado(enunciado: string, vignette?: string | null): string {
  return createHash('sha256')
    .update(normalizarTexto((vignette ?? '') + enunciado))
    .digest('hex')
}

/** Remove a letra repetida que alguns cadernos trazem ("A. texto", "A) texto"). */
export function limparAlternativa(texto: string, letra: string): string {
  const semPrefixo = texto.trim().replace(new RegExp(`^${letra}\\s*[.)\\-–]\\s*`, 'i'), '')
  return semPrefixo.trim()
}

function letraValida(v: string | null | undefined): Letra | null {
  const l = v?.trim().toUpperCase()
  return l && (LETRAS as readonly string[]).includes(l) ? (l as Letra) : null
}

export function validarProvaTranscrita(prova: ProvaTranscrita): ResultadoValidacao {
  const erros: string[] = []
  const avisos: string[] = []
  const anuladas = new Set(prova.anuladas)

  const numeros = prova.questoes.map((q) => q.numero)
  for (let n = 1; n <= prova.totalQuestoes; n++) {
    if (!numeros.includes(n)) erros.push(`Questão ${n} ausente`)
  }
  const repetidos = numeros.filter((n, i) => numeros.indexOf(n) !== i)
  if (repetidos.length > 0) erros.push(`Questões repetidas: ${[...new Set(repetidos)].join(', ')}`)

  const questoes = prova.questoes
    .slice()
    .sort((a, b) => a.numero - b.numero)
    .map((q): QuestaoNormalizada => {
      const alternativas = LETRAS.filter((l) => q.alternativas[l]?.trim()).map((letra) => ({
        letra,
        texto: limparAlternativa(q.alternativas[letra] ?? '', letra),
      }))
      if (alternativas.length < 4)
        erros.push(`Questão ${q.numero}: só ${alternativas.length} alternativas`)

      const bruto = prova.gabarito[String(q.numero)]
      const gabarito = anuladas.has(q.numero) ? null : letraValida(bruto)
      if (!anuladas.has(q.numero) && !gabarito) {
        erros.push(`Questão ${q.numero}: gabarito inválido (${bruto ?? 'vazio'})`)
      }
      if (gabarito && !alternativas.some((a) => a.letra === gabarito)) {
        erros.push(`Questão ${q.numero}: gabarito ${gabarito} não está entre as alternativas`)
      }
      if (anuladas.has(q.numero)) avisos.push(`Questão ${q.numero}: anulada (fica despublicada)`)
      if (q.observacao || /\[ileg[ií]vel\]/i.test(q.enunciado)) {
        avisos.push(`Questão ${q.numero}: ${q.observacao ?? 'trecho ilegível'}`)
      }
      for (const f of q.figuras) {
        if (f.x1 <= f.x0 || f.y1 <= f.y0)
          erros.push(`Questão ${q.numero}: caixa de figura inválida`)
      }

      const enunciado = q.enunciado.trim()
      return {
        numero: q.numero,
        enunciado,
        alternativas,
        gabarito,
        figuras: q.figuras,
        hash: hashEnunciado(enunciado),
      }
    })

  return { questoes, erros, avisos }
}

/** Id no formato cuid (o tRPC valida `z.string().cuid()`). */
export function gerarIdCuid(): string {
  const alfabeto = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(24)
  return 'c' + Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('')
}

const esc = (s: string) => `'${s.replace(/'/g, "''")}'`

export type ParametrosSql = {
  bancaCodigo: string
  ano: number
  tipo: 'R1' | 'R3' | 'R4' | 'REVALIDA' | string
  titulo: string
  fonte: string
  questoes: (QuestaoNormalizada & { imagens: string[] })[]
}

/**
 * SQL idempotente: cria a Prova (bancaId, ano, tipo) se faltar e insere questoes
 * e alternativas pulando hash ja existente. Questao anulada entra despublicada.
 */
export function montarSqlImportacao(p: ParametrosSql): string {
  const banca = `(SELECT id FROM "Banca" WHERE codigo = ${esc(p.bancaCodigo)})`
  const prova = `(SELECT id FROM "Prova" WHERE "bancaId" = ${banca} AND ano = ${p.ano} AND tipo = ${esc(p.tipo)}::"TipoProva")`
  const linhas: string[] = [
    `INSERT INTO "Prova" (id, "bancaId", ano, tipo, titulo, fonte) VALUES (${esc(gerarIdCuid())}, ${banca}, ${p.ano}, ${esc(p.tipo)}::"TipoProva", ${esc(p.titulo)}, ${esc(p.fonte)}) ON CONFLICT ("bancaId", ano, tipo) DO NOTHING;`,
  ]

  for (const q of p.questoes) {
    const imagens = `ARRAY[${q.imagens.map(esc).join(', ')}]::TEXT[]`
    linhas.push(
      `INSERT INTO "Questao" (id, "bancaId", "provaId", enunciado, "gabaritoLetra", explicacao, "explicacaoMd", ano, "numeroOriginal", fonte, hash, publicada, imagens, "updatedAt") VALUES (${esc(gerarIdCuid())}, ${banca}, ${prova}, ${esc(q.enunciado)}, ${esc(q.gabarito ?? '')}, '', '', ${p.ano}, ${q.numero}, ${esc(p.fonte)}, ${esc(q.hash)}, ${q.gabarito !== null}, ${imagens}, now()) ON CONFLICT (hash) DO NOTHING;`,
    )
    const questao = `(SELECT id FROM "Questao" WHERE hash = ${esc(q.hash)})`
    const valores = q.alternativas
      .map(
        (a, i) =>
          `(${esc(gerarIdCuid())}, ${questao}, ${esc(a.letra)}, ${esc(a.texto)}, ${a.letra === q.gabarito}, ${i})`,
      )
      .join(', ')
    linhas.push(
      `INSERT INTO "Alternativa" (id, "questaoId", letra, texto, correta, ordem) VALUES ${valores} ON CONFLICT ("questaoId", letra) DO NOTHING;`,
    )
  }
  return linhas.join('\n')
}
