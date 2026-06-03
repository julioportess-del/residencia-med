import { NextResponse } from 'next/server'
import { prismaClinico } from '@residencia-med/db-clinico'
import { removerObjetos } from '@/lib/supabase/admin'

// Limpeza de anexos expirados (retenção/LGPD): hard-delete do objeto no Storage
// e da linha no banco. Agendada via Vercel Cron (vercel.json) e protegida por
// CRON_SECRET. Vercel envia "Authorization: Bearer <CRON_SECRET>" nos crons.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const LOTE_MAXIMO = 500

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado.' }, { status: 401 })
  }

  const expirados = await prismaClinico.anexo.findMany({
    where: { expiraEm: { lt: new Date() }, excluidoEm: null },
    select: { id: true, storagePath: true },
    take: LOTE_MAXIMO,
  })

  if (expirados.length === 0) {
    return NextResponse.json({ ok: true, removidos: 0 })
  }

  const paths = expirados.map((a) => a.storagePath).filter((p) => p.length > 0)
  try {
    await removerObjetos(paths)
  } catch (erro: unknown) {
    // Best-effort: registra e segue para apagar o registro (orphans são raros e
    // limitados). Sem expor detalhes do storage.
    console.error('[anexos/limpeza] falha ao remover do storage:', erro)
  }

  const ids = expirados.map((a) => a.id)
  const { count } = await prismaClinico.anexo.deleteMany({ where: { id: { in: ids } } })

  return NextResponse.json({ ok: true, removidos: count })
}
