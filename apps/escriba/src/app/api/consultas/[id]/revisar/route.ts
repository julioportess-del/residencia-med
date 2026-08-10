import { NextResponse } from 'next/server'
import { prismaClinico } from '@residencia-med/db-clinico'
import {
  estruturaClinicaSchema,
  revisarConsulta,
  RevisaoInvalidaError,
} from '@residencia-med/ai/clinico'
import { usuarioAtual } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Contexto = { params: Promise<{ id: string }> }

function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status })
}

/**
 * Revisão inteligente de documentação: analisa a evolução gerada + a
 * transcrição e aponta lacunas de registro (medicamento sem dose,
 * contradições, alergia não registrada, etc.). Apoio à documentação —
 * não substitui a revisão médica. Multi-tenant.
 */
export async function POST(_req: Request, { params }: Contexto) {
  const { id } = await params

  const { user } = await usuarioAtual()
  if (!user) return erroJson('Não autenticado.', 401)

  const consulta = await prismaClinico.consulta.findFirst({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    select: {
      id: true,
      transcricao: { select: { texto: true } },
      evolucoes: {
        where: { dadosEstruturados: { not: undefined } },
        take: 1,
        select: { dadosEstruturados: true },
      },
    },
  })
  if (!consulta) return erroJson('Consulta não encontrada.', 404)

  const parse = estruturaClinicaSchema.safeParse(consulta.evolucoes[0]?.dadosEstruturados)
  if (!parse.success) {
    return erroJson('Esta consulta ainda não tem evolução estruturada para revisar.', 422)
  }
  const transcricao = consulta.transcricao?.texto ?? ''

  try {
    const revisao = await revisarConsulta({ estrutura: parse.data, transcricao })
    await prismaClinico.logAcesso.create({
      data: { usuarioAuthId: user.id, acao: 'REVISAR_CONSULTA_IA', consultaId: consulta.id },
    })
    return NextResponse.json({ ok: true, revisao })
  } catch (erro: unknown) {
    if (erro instanceof RevisaoInvalidaError) return erroJson(erro.message, 422)
    const msg =
      erro instanceof Error && erro.name === 'IAIndisponivelError'
        ? erro.message
        : 'Falha ao revisar a consulta. Tente novamente.'
    return erroJson(msg, 500)
  }
}
