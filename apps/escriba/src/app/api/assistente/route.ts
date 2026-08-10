import { NextResponse } from 'next/server'
import { prismaClinico } from '@residencia-med/db-clinico'
import {
  assistenteClinico,
  analisarAnexosClinicos,
  AssistenteEntradaInvalidaError,
  AnaliseAnexosInvalidaError,
  type MensagemChat,
  type AnexoParaAnalise,
} from '@residencia-med/ai/clinico'
import { usuarioAtual } from '@/lib/supabase/server'
import { baixarBytes, StorageIndisponivelError } from '@/lib/supabase/admin'
import { MAX_ANEXOS_POR_TURNO } from '@/lib/anexos-tipos'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Soma de bytes dos anexos baixados por turno (cabe na chamada do Claude e em 60s).
const TOTAL_MAXIMO_BYTES = 28 * 1024 * 1024

function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status })
}

interface CorpoAssistente {
  mensagens?: MensagemChat[]
  anexoIds?: string[]
  consultaId?: string | null
}

export async function POST(req: Request) {
  const { user } = await usuarioAtual()
  if (!user) return erroJson('Não autenticado.', 401)

  let corpo: CorpoAssistente
  try {
    corpo = (await req.json()) as CorpoAssistente
  } catch {
    return erroJson('Corpo inválido.', 400)
  }

  const mensagens = corpo.mensagens
  if (!Array.isArray(mensagens)) {
    return erroJson('Envie o histórico de mensagens.', 400)
  }

  const anexoIds = Array.isArray(corpo.anexoIds)
    ? corpo.anexoIds.filter((x): x is string => typeof x === 'string')
    : []

  // Contexto opcional da consulta: transcrição + evolução + info clínica do
  // paciente vinculado. Sempre validado por posse (multi-tenant).
  const consultaId = typeof corpo.consultaId === 'string' ? corpo.consultaId : null
  let contexto: string | undefined
  if (consultaId) {
    const consulta = await prismaClinico.consulta.findFirst({
      where: { id: consultaId, usuarioAuthId: user.id, excluidoEm: null },
      select: {
        pacienteIniciais: true,
        tipoConsulta: true,
        tipoAtendimento: true,
        criadoEm: true,
        transcricao: { select: { texto: true } },
        evolucoes: {
          where: { modelo: 'SOAP' },
          take: 1,
          select: { textoEditado: true, textoGerado: true },
        },
        paciente: {
          select: {
            alergias: true,
            medicamentos: true,
            condicoesCronicas: true,
            antecedentes: true,
          },
        },
      },
    })
    if (consulta) {
      const evolucao = consulta.evolucoes[0]
      const p = consulta.paciente
      contexto = [
        `Paciente: ${consulta.pacienteIniciais}`,
        p?.alergias.length ? `Alergias: ${p.alergias.join('; ')}` : null,
        p?.medicamentos.length
          ? `Medicamentos em uso (cadastro): ${p.medicamentos.join('; ')}`
          : null,
        p?.condicoesCronicas.length
          ? `Condições crônicas: ${p.condicoesCronicas.join('; ')}`
          : null,
        p?.antecedentes ? `Antecedentes: ${p.antecedentes}` : null,
        evolucao
          ? `EVOLUÇÃO DESTA CONSULTA:\n${(evolucao.textoEditado ?? evolucao.textoGerado).slice(0, 6000)}`
          : null,
        consulta.transcricao?.texto
          ? `TRANSCRIÇÃO DA CONSULTA:\n${consulta.transcricao.texto.slice(0, 8000)}`
          : null,
      ]
        .filter(Boolean)
        .join('\n')
    }
  }

  // Sem anexos: chat de texto puro (comportamento original).
  if (anexoIds.length === 0) {
    try {
      const resposta = await assistenteClinico(mensagens, contexto)
      await prismaClinico.logAcesso.create({
        data: { usuarioAuthId: user.id, acao: 'CONSULTAR_ASSISTENTE' },
      })
      return NextResponse.json({ ok: true, resposta })
    } catch (erro: unknown) {
      if (erro instanceof AssistenteEntradaInvalidaError) return erroJson(erro.message, 422)
      const msg =
        erro instanceof Error && erro.name === 'IAIndisponivelError'
          ? erro.message
          : 'Falha ao consultar o assistente. Tente novamente.'
      return erroJson(msg, 500)
    }
  }

  // Com anexos: análise multimodal.
  if (anexoIds.length > MAX_ANEXOS_POR_TURNO) {
    return erroJson(`Máximo de ${MAX_ANEXOS_POR_TURNO} anexos por análise.`, 422)
  }

  const pergunta = (mensagens[mensagens.length - 1]?.conteudo ?? '').trim()
  if (!pergunta) return erroJson('Escreva uma pergunta sobre os anexos.', 422)
  const historico = mensagens.slice(0, -1)

  // Carrega só anexos do próprio médico (isolamento multi-tenant).
  const anexos = await prismaClinico.anexo.findMany({
    where: { id: { in: anexoIds }, usuarioAuthId: user.id, excluidoEm: null },
    select: { id: true, nomeArquivo: true, tipoMime: true, tamanhoBytes: true, storagePath: true },
  })
  if (anexos.length !== anexoIds.length) {
    return erroJson('Um ou mais anexos não foram encontrados.', 404)
  }
  const totalBytes = anexos.reduce((s, a) => s + a.tamanhoBytes, 0)
  if (totalBytes > TOTAL_MAXIMO_BYTES) {
    return erroJson('Anexos somam tamanho demais para uma análise. Envie menos por vez.', 413)
  }

  try {
    await prismaClinico.anexo.updateMany({
      where: { id: { in: anexoIds }, usuarioAuthId: user.id },
      data: { status: 'PROCESSANDO' },
    })

    const paraAnalise: AnexoParaAnalise[] = await Promise.all(
      anexos.map(async (a) => {
        const bytes = await baixarBytes(a.storagePath)
        return {
          nomeArquivo: a.nomeArquivo,
          tipoMime: a.tipoMime,
          base64: bytes.toString('base64'),
        }
      }),
    )

    const resposta = await analisarAnexosClinicos({ pergunta, anexos: paraAnalise, historico })

    await prismaClinico.anexo.updateMany({
      where: { id: { in: anexoIds }, usuarioAuthId: user.id },
      data: { status: 'ANALISADO', analisadoEm: new Date(), resumoAnalise: resposta },
    })
    await prismaClinico.logAcesso.create({
      data: {
        usuarioAuthId: user.id,
        acao: 'ANALISAR_ANEXO',
        consultaId: corpo.consultaId ? String(corpo.consultaId) : null,
      },
    })

    return NextResponse.json({ ok: true, resposta })
  } catch (erro: unknown) {
    await prismaClinico.anexo
      .updateMany({
        where: { id: { in: anexoIds }, usuarioAuthId: user.id },
        data: { status: 'ERRO' },
      })
      .catch(() => undefined)

    if (erro instanceof AnaliseAnexosInvalidaError) return erroJson(erro.message, 422)
    if (erro instanceof StorageIndisponivelError) return erroJson(erro.message, 503)
    const msg =
      erro instanceof Error && erro.name === 'IAIndisponivelError'
        ? erro.message
        : 'Falha ao analisar os anexos. Tente novamente.'
    return erroJson(msg, 500)
  }
}
