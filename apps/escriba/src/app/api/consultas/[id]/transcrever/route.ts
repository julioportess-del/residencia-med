import { NextResponse } from 'next/server'
import { prismaClinico } from '@residencia-med/db-clinico'
import {
  transcreverAudio,
  estruturarConsulta,
  renderizarEvolucoes,
  TranscricaoVaziaError,
  EstruturacaoInvalidaError,
} from '@residencia-med/ai/clinico'
import { usuarioAtual } from '@/lib/supabase/server'
import { obterPreferencias } from '@/server/preferencias'

export const dynamic = 'force-dynamic'
// Pipeline sincrono: Whisper + Claude rodam dentro do request.
// Vercel Hobby limita a 60s; mantemos no teto do plano.
export const maxDuration = 60

const TAMANHO_MAXIMO_BYTES = 25 * 1024 * 1024 // limite do Whisper

type Contexto = { params: Promise<{ id: string }> }

function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status })
}

export async function POST(req: Request, { params }: Contexto) {
  const { id } = await params

  const { user } = await usuarioAtual()
  if (!user) return erroJson('Não autenticado.', 401)

  // Multi-tenant: só a consulta do próprio médico, não excluída.
  const consulta = await prismaClinico.consulta.findFirst({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    select: { id: true, status: true, tipoConsulta: true },
  })
  if (!consulta) return erroJson('Consulta não encontrada.', 404)
  if (consulta.status !== 'GRAVANDO') {
    return erroJson('Esta consulta já foi processada.', 409)
  }

  const form = await req.formData()
  const arquivo = form.get('audio')
  if (!(arquivo instanceof File)) {
    return erroJson('Áudio ausente no envio.', 400)
  }
  if (arquivo.size === 0) return erroJson('Áudio vazio.', 400)
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return erroJson('Áudio excede o limite de 25 MB. Grave consultas mais curtas.', 413)
  }

  // Bytes do áudio em memória — NUNCA persistidos (LGPD).
  const bytes = Buffer.from(await arquivo.arrayBuffer())
  const nomeArquivo = arquivo.name || 'consulta.webm'

  try {
    // ---- Fase 2: transcrição ----
    await prismaClinico.consulta.update({
      where: { id: consulta.id },
      data: { status: 'TRANSCREVENDO' },
    })

    const texto = await transcreverAudio(bytes, nomeArquivo)

    await prismaClinico.transcricao.upsert({
      where: { consultaId: consulta.id },
      create: { consultaId: consulta.id, texto },
      update: { texto },
    })

    // ---- Fase 3: estruturação + render ----
    await prismaClinico.consulta.update({
      where: { id: consulta.id },
      data: { status: 'ESTRUTURANDO' },
    })

    // Personalizacao do medico (especialidade + instrucoes livres) injetada no prompt.
    const pref = await obterPreferencias(user.id)
    const estrutura = await estruturarConsulta(texto, {
      tipoConsulta: consulta.tipoConsulta,
      especialidade: pref.especialidade || undefined,
      instrucoesMedico: pref.instrucoesCustom || undefined,
    })
    const evolucoes = renderizarEvolucoes(estrutura)
    const dados = estrutura as object

    // Regrava as 3 evoluções de forma idempotente (retry seguro).
    await prismaClinico.evolucao.deleteMany({ where: { consultaId: consulta.id } })
    await prismaClinico.evolucao.createMany({
      data: [
        { consultaId: consulta.id, modelo: 'SOAP', textoGerado: evolucoes.soap, dadosEstruturados: dados },
        { consultaId: consulta.id, modelo: 'CORRIDA', textoGerado: evolucoes.corrida, dadosEstruturados: dados },
        { consultaId: consulta.id, modelo: 'UBS', textoGerado: evolucoes.ubs, dadosEstruturados: dados },
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
    // Log do erro real (Whisper/Claude) para diagnostico nos logs da Vercel.
    console.error(
      '[transcrever] falha:',
      erro instanceof Error ? `${erro.name}: ${erro.message}` : String(erro),
    )

    // Reverte para GRAVANDO para permitir nova tentativa.
    await prismaClinico.consulta
      .update({ where: { id: consulta.id }, data: { status: 'GRAVANDO' } })
      .catch(() => undefined)

    if (erro instanceof TranscricaoVaziaError || erro instanceof EstruturacaoInvalidaError) {
      return erroJson(erro.message, 422)
    }
    const mensagem =
      erro instanceof Error && erro.name === 'IAIndisponivelError'
        ? erro.message
        : 'Falha ao processar a consulta. Tente novamente.'
    return erroJson(mensagem, 500)
  }
}
