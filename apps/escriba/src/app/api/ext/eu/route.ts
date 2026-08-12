import { usuarioDoBearer } from '@/lib/auth-extensao'
import { prismaClinico } from '@residencia-med/db-clinico'

export const dynamic = 'force-dynamic'

/**
 * "Quem sou eu" da extensão: valida o Bearer token e devolve dados mínimos
 * para o popup mostrar que está conectado. Também informa se há integração
 * Feegow configurada (capacidades da E2).
 */
export async function GET(req: Request) {
  const user = await usuarioDoBearer(req)
  if (!user) {
    return Response.json({ ok: false, erro: 'Token inválido ou revogado.' }, { status: 401 })
  }

  const integracao = await prismaClinico.integracaoProntuario.findUnique({
    where: {
      usuarioAuthId_sistema: { usuarioAuthId: user.id, sistema: 'FEEGOW' },
    },
    select: { ativa: true, tokenCifrado: true },
  })

  return Response.json({
    ok: true,
    usuarioId: user.id,
    feegow: { configurado: Boolean(integracao?.ativa && integracao.tokenCifrado) },
  })
}
