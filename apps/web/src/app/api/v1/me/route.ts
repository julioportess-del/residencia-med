import { jsonOk, withApiKey } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = withApiKey(async (_req, ctx) => {
  return jsonOk({
    organizacao: ctx.organization,
    scopes: ctx.scopes,
  })
})
