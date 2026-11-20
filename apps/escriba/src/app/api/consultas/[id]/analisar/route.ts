import { prismaClinico } from '@residencia-med/db-clinico'
import {
  analisarConsultaClinica,
  AnaliseInvalidaError,
} from '@residencia-med/ai/clinico'
import { usuarioDaRequisicao } from '@/lib/auth-extensao'
import { mensagemFalhaIA } from '@/lib/erros-ia'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface Contexto {
  params: Promise<{ id: string }>
}

function erroJson(erro: string, status: number) {
  return Response.json({ ok: false, erro }, { status })
}

/**
 * "Analisar consulta com IA" — Clinical Copilot: hipóteses com raciocínio,
 * sinais de alerta, sugestão de tratamento e exames, com evidências REAIS
 * (PubMed/Europe PMC). Resultado é apoio à decisão, efêmero e auditado;
 * nada entra no prontuário sem ação explícita do médico.
 */
export async function POST(req: Request, { params }: Contexto) {
  const { id } = await params
  const user = await usuarioDaRequisicao(req)
  if (!user) return erroJson('Não autenticado.', 401)

  const consulta = await prismaClinico.consulta.findFirst({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    select: {
      id: true,
      transcricao: { select: { texto: true } },
      paciente: {
        select: {
          alergias: true,
          medicamentos: true,
          condicoesCronicas: true,
          antecedentes: true,
          dataNascimento: true,
        },
      },
    },
  })
  if (!consulta) return erroJson('Consulta não encontrada.', 404)

  const transcricao = consulta.transcricao?.texto?.trim()
  if (!transcricao) {
    return erroJson(
      'Esta consulta ainda não tem transcrição. Grave a consulta primeiro — a análise parte do que foi conversado.',
      422,
    )
  }

  // Contexto clínico DESIDENTIFICADO (sem nome/CPF — só listas clínicas).
  const p = consulta.paciente
  const idade = p?.dataNascimento
    ? Math.floor((Date.now() - p.dataNascimento.getTime()) / 31_557_600_000)
    : null
  const contextoClinico = p
    ? [
        idade != null ? `Idade: ${idade} anos` : null,
        p.alergias.length ? `Alergias conhecidas: ${p.alergias.join('; ')}` : null,
        p.medicamentos.length ? `Medicamentos em uso: ${p.medicamentos.join('; ')}` : null,
        p.condicoesCronicas.length
          ? `Condições crônicas: ${p.condicoesCronicas.join('; ')}`
          : null,
        p.antecedentes?.trim() ? `Antecedentes: ${p.antecedentes.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : undefined

  try {
    const resultado = await analisarConsultaClinica({ transcricao, contextoClinico })

    await prismaClinico.logAcesso.create({
      data: { usuarioAuthId: user.id, acao: 'ANALISAR_CONSULTA_IA', consultaId: consulta.id },
    })

    return Response.json({ ok: true, ...resultado })
  } catch (erro: unknown) {
    console.error(
      '[analisar] falha:',
      erro instanceof Error ? `${erro.name}: ${erro.message}` : String(erro),
    )
    if (erro instanceof AnaliseInvalidaError) return erroJson(erro.message, 422)
    const falha = mensagemFalhaIA(erro)
    return erroJson(falha.mensagem, falha.status)
  }
}
