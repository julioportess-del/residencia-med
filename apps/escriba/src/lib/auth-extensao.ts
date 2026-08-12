import { randomBytes } from 'node:crypto'
import { prismaClinico } from '@residencia-med/db-clinico'
import { usuarioAtual } from '@/lib/supabase/server'
import { hashSha256 } from '@/lib/crypto-integracoes'

/**
 * Autenticação da extensão Chrome: Bearer token opaco (`esc_...`) emitido
 * na página de Preferências (sessão web) e colado uma única vez na
 * extensão. Só o hash sha256 fica no banco — revogável e auditável.
 */

const PREFIXO = 'esc_'

export function gerarTokenExtensao(): string {
  return `${PREFIXO}${randomBytes(32).toString('base64url')}`
}

export interface UsuarioAutenticado {
  id: string
}

/** Valida um Bearer token da extensão. Retorna o usuário ou null. */
export async function usuarioDoBearer(req: Request): Promise<UsuarioAutenticado | null> {
  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length).trim()
  if (!token.startsWith(PREFIXO)) return null

  const registro = await prismaClinico.tokenExtensao.findUnique({
    where: { hashToken: hashSha256(token) },
    select: { usuarioAuthId: true, revogadoEm: true, id: true },
  })
  if (!registro || registro.revogadoEm) return null

  // Auditoria de uso — sem bloquear a resposta.
  prismaClinico.tokenExtensao
    .update({ where: { id: registro.id }, data: { ultimoUsoEm: new Date() } })
    .catch(() => undefined)

  return { id: registro.usuarioAuthId }
}

/**
 * Autenticação dual: aceita a sessão web (cookies Supabase) OU o Bearer
 * da extensão. Usar nas rotas compartilhadas pelo app e pela extensão
 * (transcrever-chunk, estruturar).
 */
export async function usuarioDaRequisicao(req: Request): Promise<UsuarioAutenticado | null> {
  const porToken = await usuarioDoBearer(req)
  if (porToken) return porToken
  const { user } = await usuarioAtual()
  return user ? { id: user.id } : null
}
