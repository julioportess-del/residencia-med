import { createHash } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@residencia-med/db'
import { rateLimit } from './rate-limit'

export type ContextoApi = {
  apiKeyId: string
  organizationId: string
  scopes: string[]
  organization: {
    id: string
    name: string
    slug: string
    plano: string
    seats: number
  }
}

export type RotaApiHandler = (req: NextRequest, ctx: ContextoApi) => Promise<Response> | Response

const PREFIXO = 'rmed_'

export function gerarApiKey(): { plain: string; hash: string; prefixo: string } {
  const random = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const plain = `${PREFIXO}${random}`
  const hash = createHash('sha256').update(plain).digest('hex')
  const prefixo = plain.slice(0, 12) // rmed_xxxxxx
  return { plain, hash, prefixo }
}

export function hashApiKey(plain: string): string {
  return createHash('sha256').update(plain).digest('hex')
}

/**
 * Wrapper para handlers de /api/v1/*. Faz autenticação via Bearer, rate limit
 * por chave, registra uso, e injeta contexto da organização.
 */
export function withApiKey(handler: RotaApiHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const inicio = Date.now()
    const auth = req.headers.get('authorization') ?? ''
    if (!auth.startsWith('Bearer ')) {
      return jsonError(401, 'missing_bearer', 'Falta header Authorization: Bearer <chave>')
    }
    const plain = auth.slice('Bearer '.length).trim()
    if (!plain.startsWith(PREFIXO)) {
      return jsonError(401, 'invalid_key_format', 'Chave inválida')
    }

    const hash = hashApiKey(plain)
    let apiKey
    try {
      apiKey = await prisma.apiKey.findUnique({
        where: { hash },
        include: { organization: true },
      })
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[api-auth] erro lookup', (e as Error).message)
      }
      return jsonError(503, 'service_unavailable', 'Banco de dados indisponível')
    }
    if (!apiKey) {
      return jsonError(401, 'unknown_key', 'Chave desconhecida')
    }
    if (apiKey.revogadaEm) {
      return jsonError(401, 'revoked_key', 'Chave revogada')
    }
    if (apiKey.expiraEm && apiKey.expiraEm < new Date()) {
      return jsonError(401, 'expired_key', 'Chave expirada')
    }

    // Rate limit: 100 req/min por chave (default)
    const rl = await rateLimit({
      chave: `apikey:${apiKey.id}`,
      limite: apiKey.organization.plano === 'STARTER' ? 100 : 1000,
      janelaSegundos: 60,
    })
    if (!rl.permitido) {
      return jsonError(429, 'rate_limit', 'Limite por minuto atingido')
    }

    const ctx: ContextoApi = {
      apiKeyId: apiKey.id,
      organizationId: apiKey.organizationId,
      scopes: apiKey.scopes,
      organization: {
        id: apiKey.organization.id,
        name: apiKey.organization.name,
        slug: apiKey.organization.slug,
        plano: apiKey.organization.plano,
        seats: apiKey.organization.seats,
      },
    }

    let resposta: Response
    try {
      resposta = await handler(req, ctx)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown_error'
      resposta = jsonError(500, 'internal', msg)
    }

    // Registra uso (best-effort, não bloqueia)
    void prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { ultimoUsoEm: new Date() },
      })
      .catch(() => {})
    void prisma.apiKeyUso
      .create({
        data: {
          apiKeyId: apiKey.id,
          rota: new URL(req.url).pathname,
          status: resposta.status,
          latenciaMs: Date.now() - inicio,
        },
      })
      .catch(() => {})

    return resposta
  }
}

export function exigeScope(ctx: ContextoApi, scope: string): Response | null {
  if (!ctx.scopes.includes(scope) && !ctx.scopes.includes('admin')) {
    return jsonError(403, 'forbidden_scope', `Esta rota exige scope '${scope}'`)
  }
  return null
}

export function jsonError(status: number, codigo: string, mensagem: string): Response {
  return NextResponse.json({ error: { codigo, mensagem } }, { status })
}

export function jsonOk(data: unknown, status = 200): Response {
  return NextResponse.json(data, { status })
}
