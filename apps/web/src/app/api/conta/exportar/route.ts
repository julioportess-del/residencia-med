import { NextResponse } from 'next/server'
import { prisma } from '@residencia-med/db'
import { supabaseUserAtual } from '@/lib/supabase/server'
import { garantirUser } from '@/server/trpc'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { user: authUser } = await supabaseUserAtual()
  if (!authUser?.email) return new NextResponse('Unauthorized', { status: 401 })
  const user = await garantirUser(authUser.id, authUser.email)

  const dados = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      respostas: { take: 5000, orderBy: { createdAt: 'desc' } },
      sessoes: { take: 500, orderBy: { iniciadaEm: 'desc' } },
      planoEstudo: { include: { blocos: true } },
      itensRevisao: true,
      assinatura: true,
    },
  })
  if (!dados) return new NextResponse('Not found', { status: 404 })

  const { id: _id, authId: _aid, ...perfil } = dados
  void _id
  void _aid

  const json = JSON.stringify(
    { exportadoEm: new Date(), perfil },
    null,
    2,
  )
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="residencia-med-${user.id}.json"`,
    },
  })
}
