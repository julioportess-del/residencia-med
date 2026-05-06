import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@residencia-med/db'
import { garantirUser } from '@/server/trpc'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })
  const user = await garantirUser(clerkId)

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

  const { id: _id, clerkId: _ck, ...perfil } = dados
  void _id
  void _ck

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
