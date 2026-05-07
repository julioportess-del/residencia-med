import { NextResponse } from 'next/server'
import { prisma } from '@residencia-med/db'
import { supabaseUserAtual } from '@/lib/supabase/server'
import { garantirUser } from '@/server/trpc'

export const dynamic = 'force-dynamic'

/**
 * Exporta itens de revisão como CSV pronto pra importar no Anki:
 * front;back;tags
 *
 * Formato:
 *   - front: enunciado (com vinheta se houver)
 *   - back: gabarito + explicação completa em HTML
 *   - tags: banca, ano, dificuldade, tema
 *
 * No Anki: File → Import → Field separator: Semicolon → mapear front/back/tags.
 */
export async function GET() {
  let authUser
  try {
    const r = await supabaseUserAtual()
    authUser = r.user
  } catch {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  if (!authUser?.email) return new NextResponse('Unauthorized', { status: 401 })

  let user
  try {
    user = await garantirUser(authUser.id, authUser.email)
  } catch {
    return NextResponse.json(
      { error: 'Banco indisponível.' },
      { status: 503 },
    )
  }

  let itens
  try {
    itens = await prisma.itemRevisao.findMany({
      where: { userId: user.id },
      include: {
        questao: {
          include: {
            banca: { select: { codigo: true } },
            alternativas: { orderBy: { ordem: 'asc' } },
            temas: {
              where: { primario: true },
              select: { tema: { select: { nome: true, codigo: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: { proximaRevisao: 'asc' },
      take: 5000,
    })
  } catch {
    return NextResponse.json(
      { error: 'Banco indisponível. Configure DATABASE_URL para exportar.' },
      { status: 503 },
    )
  }

  const linhas: string[] = ['front;back;tags']
  for (const item of itens) {
    const q = item.questao
    const front = montarFront(q)
    const back = montarBack(q)
    const tags = [
      `banca-${q.banca.codigo.toLowerCase()}`,
      `ano-${q.ano}`,
      `dificuldade-${q.dificuldade.toLowerCase()}`,
      ...(q.temas[0]?.tema ? [`tema-${q.temas[0].tema.codigo.toLowerCase()}`] : []),
      'residencia-med',
    ].join(' ')
    linhas.push(`${escapar(front)};${escapar(back)};${escapar(tags)}`)
  }

  const csv = linhas.join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="residencia-med-anki-${user.id.slice(0, 8)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}

type QuestaoForExport = {
  enunciado: string
  enunciadoVignette: string | null
  gabaritoLetra: string
  explicacaoMd: string
  ano: number
  dificuldade: string
  banca: { codigo: string }
  alternativas: Array<{ letra: string; texto: string; correta: boolean; explicacaoErro: string | null }>
  temas: Array<{ tema: { nome: string; codigo: string } }>
}

function montarFront(q: QuestaoForExport): string {
  const partes: string[] = []
  if (q.enunciadoVignette) partes.push(`<div><em>${q.enunciadoVignette}</em></div><br>`)
  partes.push(`<div><b>${q.enunciado}</b></div><br>`)
  partes.push('<ol type="A">')
  for (const a of q.alternativas) {
    partes.push(`<li>${a.texto}</li>`)
  }
  partes.push('</ol>')
  partes.push(
    `<div style="margin-top:8px;color:#64748b;font-size:12px">${q.banca.codigo} · ${q.ano}</div>`,
  )
  return partes.join('')
}

function montarBack(q: QuestaoForExport): string {
  const correta = q.alternativas.find((a) => a.correta)
  const partes: string[] = []
  partes.push(
    `<div style="font-size:18px;font-weight:bold;color:#10b981">Gabarito: ${q.gabaritoLetra}</div><br>`,
  )
  if (correta) partes.push(`<div><b>${correta.letra})</b> ${correta.texto}</div><br>`)
  partes.push(`<div>${q.explicacaoMd.replace(/\n/g, '<br>')}</div>`)
  return partes.join('')
}

function escapar(texto: string): string {
  // CSV com separador `;`: aspas duplas em volta de campos com `;` ou aspas
  if (texto.includes(';') || texto.includes('"') || texto.includes('\n')) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}
