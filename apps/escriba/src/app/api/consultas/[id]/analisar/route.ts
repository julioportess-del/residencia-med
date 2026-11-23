import { prismaClinico } from '@residencia-med/db-clinico'
import {
  analisarConsultaClinica,
  AnaliseInvalidaError,
  estruturaClinicaSchema,
  gerarParteAnalise,
  prepararEvidenciasAnalise,
  verificarSegurancaClinica,
  type Evidencia,
  type ParteAnalise,
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
      evolucoes: { select: { dadosEstruturados: true }, take: 1 },
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
        p.condicoesCronicas.length ? `Condições crônicas: ${p.condicoesCronicas.join('; ')}` : null,
        p.antecedentes?.trim() ? `Antecedentes: ${p.antecedentes.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : undefined

  // Clinical Safety Engine: cruzamento determinístico alergias/medicamentos
  // em uso × prescrições sugeridas na evolução (cadastro + relato da consulta).
  const estruturaParse = estruturaClinicaSchema.safeParse(consulta.evolucoes[0]?.dadosEstruturados)
  const estrutura = estruturaParse.success ? estruturaParse.data : null
  const alergiasConhecidas = [...(p?.alergias ?? []), ...(estrutura?.subjetivo.alergias ?? [])]
  const medicamentosConhecidos = [
    ...(p?.medicamentos ?? []),
    ...(estrutura?.subjetivo.medicacoesEmUso ?? []),
  ]
  const alertasSeguranca = verificarSegurancaClinica({
    alergias: alergiasConhecidas,
    medicamentosEmUso: medicamentosConhecidos.length > 0 ? medicamentosConhecidos : null,
    prescricoes: estrutura?.plano.prescricoes ?? [],
  })

  // Fluxo em DUAS requisições para caber no limite de 60s do serverless:
  // etapa "preparar" (termos + fontes + segurança, ~10s) e etapa "gerar"
  // (só a chamada do modelo, com o orçamento de tempo inteiro).
  const corpo = (await req.json().catch(() => ({}))) as {
    etapa?: 'preparar' | 'gerar' | 'gerar-raciocinio' | 'gerar-conduta'
    fontes?: Evidencia[]
    termosBusca?: string
  }

  const t0 = Date.now()
  try {
    if (corpo.etapa === 'preparar') {
      const prep = await prepararEvidenciasAnalise(transcricao, contextoClinico)
      console.info(
        `[analisar] etapa=preparar ms=${Date.now() - t0} fontes=${prep.fontes.length} chars=${transcricao.length}`,
      )
      return Response.json({ ok: true, ...prep, alertasSeguranca })
    }

    // Geração por PARTES: cada requisição faz UMA chamada curta ao modelo
    // (raciocínio ou conduta) — o cliente roda as duas em paralelo.
    if (corpo.etapa === 'gerar-raciocinio' || corpo.etapa === 'gerar-conduta') {
      const parteNome: ParteAnalise = corpo.etapa === 'gerar-raciocinio' ? 'raciocinio' : 'conduta'
      const parte = await gerarParteAnalise(parteNome, {
        transcricao,
        contextoClinico,
        fontes: Array.isArray(corpo.fontes) ? corpo.fontes : [],
        termosBusca: typeof corpo.termosBusca === 'string' ? corpo.termosBusca : '',
      })
      console.info(
        `[analisar] etapa=${corpo.etapa} ms=${Date.now() - t0} chars=${transcricao.length}`,
      )
      if (parteNome === 'conduta') {
        await prismaClinico.logAcesso.create({
          data: { usuarioAuthId: user.id, acao: 'ANALISAR_CONSULTA_IA', consultaId: consulta.id },
        })
      }
      return Response.json({ ok: true, parte })
    }

    const resultado = await analisarConsultaClinica({
      transcricao,
      contextoClinico,
      ...(corpo.etapa === 'gerar'
        ? {
            fontesPreBuscadas: Array.isArray(corpo.fontes) ? corpo.fontes : [],
            termosPreExtraidos: typeof corpo.termosBusca === 'string' ? corpo.termosBusca : '',
          }
        : {}),
    })

    console.info(
      `[analisar] etapa=${corpo.etapa ?? 'unica'} ms=${Date.now() - t0} chars=${transcricao.length}`,
    )
    await prismaClinico.logAcesso.create({
      data: { usuarioAuthId: user.id, acao: 'ANALISAR_CONSULTA_IA', consultaId: consulta.id },
    })

    return Response.json({ ok: true, ...resultado, alertasSeguranca })
  } catch (erro: unknown) {
    console.error(
      `[analisar] falha etapa=${corpo.etapa ?? 'unica'} ms=${Date.now() - t0}:`,
      erro instanceof Error ? `${erro.name}: ${erro.message}` : String(erro),
    )
    if (erro instanceof AnaliseInvalidaError) return erroJson(erro.message, 422)
    const falha = mensagemFalhaIA(erro)
    return erroJson(falha.mensagem, falha.status)
  }
}
