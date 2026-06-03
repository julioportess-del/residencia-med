import { NextResponse } from 'next/server'
import { prismaClinico } from '@residencia-med/db-clinico'
import {
  estruturarConsulta,
  renderizarEvolucoes,
  EstruturacaoInvalidaError,
} from '@residencia-med/ai/clinico'
import { usuarioAtual } from '@/lib/supabase/server'
import { obterPreferencias } from '@/server/preferencias'

export const dynamic = 'force-dynamic'
// Uma única chamada ao Claude → dentro do limite Hobby (60 s).
export const maxDuration = 60

const TAMANHO_MAXIMO_TRANSCRICAO = 200_000

type Contexto = { params: Promise<{ id: string }> }

function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status })
}

/**
 * Recebe a transcrição completa (já montada no navegador a partir dos chunks),
 * estrutura em SOAP/corrida/UBS via Claude e grava as evoluções. Rascunho para
 * revisão médica obrigatória. Multi-tenant.
 */
export async function POST(req: Request, { params }: Contexto) {
  const { id } = await params

  const { user } = await usuarioAtual()
  if (!user) return erroJson('Não autenticado.', 401)

  const consulta = await prismaClinico.consulta.findFirst({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    select: { id: true, status: true, tipoConsulta: true },
  })
  if (!consulta) return erroJson('Consulta não encontrada.', 404)
  if (consulta.status === 'REVISADO') {
    return erroJson('Esta consulta já foi finalizada.', 409)
  }

  let corpo: unknown
  try {
    corpo = await req.json()
  } catch {
    return erroJson('Corpo inválido.', 400)
  }
  const transcricao = (corpo as { transcricao?: string })?.transcricao?.trim() ?? ''
  if (!transcricao) return erroJson('Transcrição vazia.', 422)
  if (transcricao.length > TAMANHO_MAXIMO_TRANSCRICAO) {
    return erroJson('Transcrição muito longa.', 413)
  }

  try {
    await prismaClinico.consulta.update({
      where: { id: consulta.id },
      data: { status: 'ESTRUTURANDO' },
    })

    // Guarda a transcrição (texto, não áudio) e gera a estrutura.
    await prismaClinico.transcricao.upsert({
      where: { consultaId: consulta.id },
      create: { consultaId: consulta.id, texto: transcricao },
      update: { texto: transcricao },
    })

    const pref = await obterPreferencias(user.id)
    const estrutura = await estruturarConsulta(transcricao, {
      tipoConsulta: consulta.tipoConsulta,
      especialidade: pref.especialidade || undefined,
      instrucoesMedico: pref.instrucoesCustom || undefined,
    })
    const evolucoes = renderizarEvolucoes(estrutura)
    const dados = estrutura as object

    await prismaClinico.evolucao.deleteMany({ where: { consultaId: consulta.id } })
    await prismaClinico.evolucao.createMany({
      data: [
        {
          consultaId: consulta.id,
          modelo: 'SOAP',
          textoGerado: evolucoes.soap,
          dadosEstruturados: dados,
        },
        {
          consultaId: consulta.id,
          modelo: 'CORRIDA',
          textoGerado: evolucoes.corrida,
          dadosEstruturados: dados,
        },
        {
          consultaId: consulta.id,
          modelo: 'UBS',
          textoGerado: evolucoes.ubs,
          dadosEstruturados: dados,
        },
      ],
    })

    await prismaClinico.consulta.update({
      where: { id: consulta.id },
      data: { status: 'RASCUNHO' },
    })
    await prismaClinico.logAcesso.create({
      data: { usuarioAuthId: user.id, acao: 'PROCESSAR_CONSULTA', consultaId: consulta.id },
    })

    return NextResponse.json({ ok: true, id: consulta.id })
  } catch (erro: unknown) {
    console.error(
      '[estruturar] falha:',
      erro instanceof Error ? `${erro.name}: ${erro.message}` : String(erro),
    )
    await prismaClinico.consulta
      .update({ where: { id: consulta.id }, data: { status: 'GRAVANDO' } })
      .catch(() => undefined)

    if (erro instanceof EstruturacaoInvalidaError) {
      return erroJson(erro.message, 422)
    }
    const mensagem =
      erro instanceof Error && erro.name === 'IAIndisponivelError'
        ? erro.message
        : 'Falha ao estruturar a consulta. Tente novamente.'
    return erroJson(mensagem, 500)
  }
}
