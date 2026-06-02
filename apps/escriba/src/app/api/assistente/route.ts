import { NextResponse } from 'next/server'
import { prismaClinico } from '@residencia-med/db-clinico'
import {
  assistenteClinico,
  AssistenteEntradaInvalidaError,
  type MensagemChat,
} from '@residencia-med/ai/clinico'
import { usuarioAtual } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status })
}

export async function POST(req: Request) {
  const { user } = await usuarioAtual()
  if (!user) return erroJson('Não autenticado.', 401)

  let corpo: unknown
  try {
    corpo = await req.json()
  } catch {
    return erroJson('Corpo inválido.', 400)
  }

  const mensagens = (corpo as { mensagens?: MensagemChat[] })?.mensagens
  if (!Array.isArray(mensagens)) {
    return erroJson('Envie o histórico de mensagens.', 400)
  }

  try {
    const resposta = await assistenteClinico(mensagens)

    // Auditoria LGPD: registramos apenas o acesso, nunca o conteúdo da conversa.
    await prismaClinico.logAcesso.create({
      data: { usuarioAuthId: user.id, acao: 'CONSULTAR_ASSISTENTE' },
    })

    return NextResponse.json({ ok: true, resposta })
  } catch (erro: unknown) {
    if (erro instanceof AssistenteEntradaInvalidaError) {
      return erroJson(erro.message, 422)
    }
    const mensagem =
      erro instanceof Error && erro.name === 'IAIndisponivelError'
        ? erro.message
        : 'Falha ao consultar o assistente. Tente novamente.'
    return erroJson(mensagem, 500)
  }
}
