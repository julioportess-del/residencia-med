import { subDays } from 'date-fns'
import { prisma } from '@residencia-med/db'
import { exigeScope, jsonOk, withApiKey } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/v1/dashboard
 * Retorna agregado da organização nos últimos 30 dias.
 */
export const GET = withApiKey(async (_req, ctx) => {
  const erro = exigeScope(ctx, 'read')
  if (erro) return erro

  const ha30d = subDays(new Date(), 30)

  const [usuarios, respostasMes] = await Promise.all([
    prisma.user.count({ where: { organizationId: ctx.organizationId } }),
    prisma.resposta.findMany({
      where: {
        user: { organizationId: ctx.organizationId },
        createdAt: { gte: ha30d },
      },
      select: {
        correta: true,
        userId: true,
        questao: {
          select: {
            temas: {
              where: { primario: true },
              select: { tema: { select: { id: true, nome: true } } },
              take: 1,
            },
          },
        },
      },
    }),
  ])

  const ativos30d = new Set(respostasMes.map((r) => r.userId)).size
  const totalRespostas = respostasMes.length
  const acertos = respostasMes.filter((r) => r.correta).length
  const taxa = totalRespostas > 0 ? acertos / totalRespostas : 0

  const porTema = new Map<string, { total: number; acertos: number; nome: string }>()
  for (const r of respostasMes) {
    const t = r.questao.temas[0]?.tema
    if (!t) continue
    const ent = porTema.get(t.id) ?? { total: 0, acertos: 0, nome: t.nome }
    ent.total++
    if (r.correta) ent.acertos++
    porTema.set(t.id, ent)
  }
  const fracos = Array.from(porTema.values())
    .filter((v) => v.total >= 5)
    .map((v) => ({ tema: v.nome, total: v.total, taxa: v.acertos / v.total }))
    .sort((a, b) => a.taxa - b.taxa)
    .slice(0, 10)

  return jsonOk({
    organizationId: ctx.organizationId,
    janela: '30d',
    usuariosTotal: usuarios,
    ativos30d,
    respostasMes: totalRespostas,
    taxaMedia: taxa,
    temasFracos: fracos,
  })
})
