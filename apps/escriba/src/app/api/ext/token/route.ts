import { prismaClinico } from '@residencia-med/db-clinico'
import { usuarioAtual } from '@/lib/supabase/server'
import { gerarTokenExtensao } from '@/lib/auth-extensao'
import { hashSha256 } from '@/lib/crypto-integracoes'

export const dynamic = 'force-dynamic'

/**
 * Emite um token para a extensão Chrome. Exige sessão web (o médico está
 * logado nas Preferências). O valor em claro é retornado UMA única vez;
 * apenas o hash fica no banco. Tokens anteriores são revogados — 1 token
 * ativo por médico mantém o controle simples.
 */
export async function POST() {
  const { user } = await usuarioAtual()
  if (!user) {
    return Response.json({ ok: false, erro: 'Não autenticado.' }, { status: 401 })
  }

  const token = gerarTokenExtensao()

  await prismaClinico.$transaction([
    prismaClinico.tokenExtensao.updateMany({
      where: { usuarioAuthId: user.id, revogadoEm: null },
      data: { revogadoEm: new Date() },
    }),
    prismaClinico.tokenExtensao.create({
      data: { usuarioAuthId: user.id, hashToken: hashSha256(token) },
    }),
    prismaClinico.logAcesso.create({
      data: { usuarioAuthId: user.id, acao: 'GERAR_TOKEN_EXTENSAO' },
    }),
  ])

  return Response.json({ ok: true, token })
}
