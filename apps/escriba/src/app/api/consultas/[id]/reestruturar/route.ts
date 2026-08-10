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
import { resumoUltimaConsulta, contextoRetornoParaIA } from '@/server/retorno'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Contexto = { params: Promise<{ id: string }> }

function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status })
}

/**
 * Regera as evoluções a partir da transcrição JÁ SALVA (sem regravar). Usado
 * quando a estruturação inicial falhou/expirou. Multi-tenant.
 */
export async function POST(_req: Request, { params }: Contexto) {
  const { id } = await params

  const { user } = await usuarioAtual()
  if (!user) return erroJson('Não autenticado.', 401)

  const consulta = await prismaClinico.consulta.findFirst({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    select: {
      id: true,
      status: true,
      tipoConsulta: true,
      tipoAtendimento: true,
      modeloId: true,
      pacienteId: true,
      transcricao: { select: { texto: true } },
    },
  })
  if (!consulta) return erroJson('Consulta não encontrada.', 404)
  if (consulta.status === 'REVISADO') return erroJson('Esta consulta já foi finalizada.', 409)

  const transcricao = consulta.transcricao?.texto?.trim() ?? ''
  if (!transcricao) {
    return erroJson('Não há transcrição salva. Volte e grave a consulta.', 422)
  }

  try {
    await prismaClinico.consulta.update({
      where: { id: consulta.id },
      data: { status: 'ESTRUTURANDO' },
    })

    const pref = await obterPreferencias(user.id)
    const modelo = consulta.modeloId ? await contextoDoModelo(user.id, consulta.modeloId) : null
    const resumoAnterior =
      consulta.tipoAtendimento === 'RETORNO' && consulta.pacienteId
        ? await resumoUltimaConsulta(user.id, consulta.pacienteId, consulta.id)
        : null
    const instrucoes = [
      modelo?.instrucoes,
      pref.instrucoesCustom,
      resumoAnterior ? contextoRetornoParaIA(resumoAnterior) : null,
    ]
      .filter(Boolean)
      .join('\n\n')
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
      '[reestruturar] falha:',
      erro instanceof Error ? `${erro.name}: ${erro.message}` : String(erro),
    )
    await prismaClinico.consulta
      .update({ where: { id: consulta.id }, data: { status: 'RASCUNHO' } })
      .catch(() => undefined)

    if (erro instanceof EstruturacaoInvalidaError) return erroJson(erro.message, 422)
    const ehTimeout =
      erro instanceof Error &&
      (erro.name === 'APIConnectionTimeoutError' || /timeout|timed out/i.test(erro.message))
    const mensagem = ehTimeout
      ? 'A geração demorou mais que o limite do servidor. Tente novamente.'
      : erro instanceof Error && erro.name === 'IAIndisponivelError'
        ? erro.message
        : 'Falha ao gerar a evolução. Tente novamente.'
    return erroJson(mensagem, ehTimeout ? 504 : 500)
  }
}
