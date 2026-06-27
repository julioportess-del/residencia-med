import { NextResponse } from 'next/server'
import { prismaClinico } from '@residencia-med/db-clinico'
import {
  estruturarConsulta,
  renderizarEvolucoes,
  EstruturacaoInvalidaError,
} from '@residencia-med/ai/clinico'
import { usuarioAtual } from '@/lib/supabase/server'
import { obterPreferencias } from '@/server/preferencias'
import { contextoDoModelo } from '@/server/modelos'

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
    select: { id: true, status: true, tipoConsulta: true, modeloId: true },
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
    // Modelo aplicado à consulta (se houver) guia a IA: especialidade + instruções.
    const modelo = consulta.modeloId ? await contextoDoModelo(user.id, consulta.modeloId) : null
    const instrucoes = [modelo?.instrucoes, pref.instrucoesCustom].filter(Boolean).join('\n\n')
    const estrutura = await estruturarConsulta(transcricao, {
      tipoConsulta: consulta.tipoConsulta,
      especialidade: modelo?.especialidade || pref.especialidade || undefined,
      instrucoesMedico: instrucoes || undefined,
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
    // A transcrição já está salva. Deixa a consulta como RASCUNHO (recuperável):
    // o médico pode "Gerar evolução novamente" sem regravar. NUNCA volta a GRAVANDO.
    await prismaClinico.consulta
      .update({ where: { id: consulta.id }, data: { status: 'RASCUNHO' } })
      .catch(() => undefined)

    if (erro instanceof EstruturacaoInvalidaError) {
      return erroJson(erro.message, 422)
    }
    const ehTimeout =
      erro instanceof Error &&
      (erro.name === 'APIConnectionTimeoutError' || /timeout|timed out/i.test(erro.message))
    if (ehTimeout) {
      return erroJson(
        'A geração demorou mais que o limite do servidor. A transcrição foi salva — toque em "Gerar evolução novamente".',
        504,
      )
    }
    const mensagem =
      erro instanceof Error && erro.name === 'IAIndisponivelError'
        ? erro.message
        : 'Falha ao estruturar a consulta. A transcrição foi salva — tente gerar novamente.'
    return erroJson(mensagem, 500)
  }
}
