import { prisma } from '@residencia-med/db'
import { exigeScope, jsonOk, withApiKey } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = withApiKey(async (req, ctx) => {
  const erro = exigeScope(ctx, 'read')
  if (erro) return erro

  const url = new URL(req.url)
  const limite = Math.min(Number(url.searchParams.get('limit') ?? 50), 200)
  const cursor = url.searchParams.get('cursor') ?? undefined

  const membros = await prisma.user.findMany({
    where: { organizationId: ctx.organizationId },
    take: limite + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      papelOrg: true,
      createdAt: true,
      _count: { select: { respostas: true } },
    },
  })

  let proxCursor: string | undefined
  if (membros.length > limite) {
    const ultimo = membros.pop()
    proxCursor = ultimo?.id
  }

  return jsonOk({
    itens: membros.map((m) => ({
      id: m.id,
      email: m.email,
      nome: m.name,
      papel: m.papelOrg,
      criadoEm: m.createdAt,
      totalRespostas: m._count.respostas,
    })),
    proxCursor,
  })
})
