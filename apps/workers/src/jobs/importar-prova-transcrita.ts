/**
 * Job: importa uma prova transcrita (JSON no formato ProvaTranscrita) para o banco.
 *
 * Recorta as figuras do PDF original (pdftoppm), opcionalmente envia ao Storage
 * do Supabase (bucket público "questoes") e gera SQL idempotente para aplicar
 * por fora (ex.: `supabase db query --linked -f saida.sql`).
 *
 * Uso:
 *   pnpm --filter @residencia-med/workers importar-prova -- \
 *     --json sus-sp-2026.json --pdf caderno.pdf --banca SUS-SP \
 *     --titulo "SUS-SP 2026 — R1" --fonte "..." --saida-sql out.sql \
 *     [--enviar-imagens] [--dir-imagens ./figuras] [--forcar]
 *
 * --enviar-imagens exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.
 * Sem --forcar, qualquer erro de validação aborta (nada é gerado).
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import {
  montarSqlImportacao,
  ProvaTranscritaSchema,
  validarProvaTranscrita,
  type FiguraTranscrita,
} from '@residencia-med/core/importacao-prova'
import { logger } from '../logger'

const BUCKET = 'questoes'
const DPI_RECORTE = 200

const { values: args } = parseArgs({
  options: {
    json: { type: 'string' },
    pdf: { type: 'string' },
    banca: { type: 'string' },
    tipo: { type: 'string', default: 'R1' },
    titulo: { type: 'string' },
    fonte: { type: 'string' },
    'saida-sql': { type: 'string' },
    'dir-imagens': { type: 'string', default: './figuras' },
    'enviar-imagens': { type: 'boolean', default: false },
    forcar: { type: 'boolean', default: false },
  },
})

function obrigatorio(nome: keyof typeof args): string {
  const v = args[nome]
  if (typeof v !== 'string' || v === '') throw new Error(`--${nome} é obrigatório`)
  return v
}

/** Tamanho da página em pontos (pdfinfo). */
function tamanhoPagina(pdf: string, pagina: number): { w: number; h: number } {
  const saida = execFileSync('pdfinfo', ['-f', String(pagina), '-l', String(pagina), pdf], {
    encoding: 'utf8',
  })
  const m = saida.match(/Page\s+\d+\s+size:\s+([\d.]+) x ([\d.]+)/)
  if (!m) throw new Error(`Não consegui ler o tamanho da página ${pagina}`)
  return { w: Number(m[1]), h: Number(m[2]) }
}

function recortarFigura(pdf: string, f: FiguraTranscrita, destinoSemExt: string): string {
  const { w, h } = tamanhoPagina(pdf, f.pagina)
  const escala = DPI_RECORTE / 72
  const [x, y] = [Math.floor(f.x0 * w * escala), Math.floor(f.y0 * h * escala)]
  const [largura, altura] = [
    Math.ceil((f.x1 - f.x0) * w * escala),
    Math.ceil((f.y1 - f.y0) * h * escala),
  ]
  execFileSync('pdftoppm', [
    '-f',
    String(f.pagina),
    '-l',
    String(f.pagina),
    '-r',
    String(DPI_RECORTE),
    '-x',
    String(x),
    '-y',
    String(y),
    '-W',
    String(largura),
    '-H',
    String(altura),
    '-png',
    '-singlefile',
    pdf,
    destinoSemExt,
  ])
  return `${destinoSemExt}.png`
}

async function enviarAoStorage(arquivo: string, caminho: string): Promise<string> {
  const base = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !chave) throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários')
  const resp = await fetch(`${base}/storage/v1/object/${BUCKET}/${caminho}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${chave}`,
      apikey: chave,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: readFileSync(arquivo),
  })
  if (!resp.ok) throw new Error(`Upload ${caminho} falhou: ${resp.status} ${await resp.text()}`)
  return `${base}/storage/v1/object/public/${BUCKET}/${caminho}`
}

async function main() {
  const prova = ProvaTranscritaSchema.parse(JSON.parse(readFileSync(obrigatorio('json'), 'utf8')))
  const banca = obrigatorio('banca')
  const pdf = obrigatorio('pdf')
  const { questoes, erros, avisos } = validarProvaTranscrita(prova)

  for (const a of avisos) logger.warn(a)
  if (erros.length > 0) {
    for (const e of erros) logger.error(e)
    if (!args.forcar)
      throw new Error(`${erros.length} erro(s) de validação — use --forcar para ignorar`)
  }

  const dir = join(args['dir-imagens'] ?? './figuras', banca, String(prova.ano))
  mkdirSync(dir, { recursive: true })

  const comImagens = []
  for (const q of questoes) {
    const imagens: string[] = []
    for (const [i, f] of q.figuras.entries()) {
      const nome = `q${String(q.numero).padStart(3, '0')}-${i + 1}`
      const arquivo = recortarFigura(pdf, f, join(dir, nome))
      imagens.push(
        args['enviar-imagens']
          ? await enviarAoStorage(arquivo, `${banca}/${prova.ano}/${nome}.png`)
          : arquivo,
      )
    }
    comImagens.push({ ...q, imagens })
  }

  const sql = montarSqlImportacao({
    bancaCodigo: banca,
    ano: prova.ano,
    tipo: args.tipo ?? 'R1',
    titulo: args.titulo ?? `${banca} ${prova.ano}`,
    fonte: args.fonte ?? `${banca} ${prova.ano}`,
    questoes: comImagens,
  })
  writeFileSync(obrigatorio('saida-sql'), `BEGIN;\n${sql}\nCOMMIT;\n`)

  logger.info(
    {
      questoes: questoes.length,
      publicadas: questoes.filter((q) => q.gabarito !== null).length,
      figuras: comImagens.reduce((s, q) => s + q.imagens.length, 0),
      erros: erros.length,
      avisos: avisos.length,
    },
    'SQL de importação gerado',
  )
}

main().catch((e: unknown) => {
  logger.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
