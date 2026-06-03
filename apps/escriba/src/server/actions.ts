'use server'

import { revalidatePath } from 'next/cache'
import { prismaClinico } from '@residencia-med/db-clinico'
import {
  estruturaClinicaSchema,
  renderizarDocumento,
  type TipoDocumento,
  type OpcoesAtestado,
} from '@residencia-med/ai/clinico'
import { exigirUsuario } from '@/lib/auth'
import {
  novaConsultaSchema,
  preferenciasSchema,
  type NovaConsultaInput,
  type PreferenciasInput,
} from '@/lib/validacao'

export type ResultadoCriarConsulta = { ok: true; id: string } | { ok: false; erro: string }

export type ResultadoAcao = { ok: true } | { ok: false; erro: string }

const TAMANHO_MAXIMO_EVOLUCAO = 20_000

/** Cria uma consulta em GRAVANDO. Sem nome/CPF — apenas iniciais (LGPD). */
export async function criarConsulta(entrada: NovaConsultaInput): Promise<ResultadoCriarConsulta> {
  const user = await exigirUsuario()

  const analise = novaConsultaSchema.safeParse(entrada)
  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { pacienteIniciais, tipoConsulta } = analise.data

  const consulta = await prismaClinico.consulta.create({
    data: {
      usuarioAuthId: user.id,
      pacienteIniciais: pacienteIniciais.trim(),
      tipoConsulta,
      status: 'GRAVANDO',
      consentimentoConfirmado: true,
      consentimentoEm: new Date(),
    },
    select: { id: true },
  })

  await prismaClinico.logAcesso.create({
    data: { usuarioAuthId: user.id, acao: 'CRIAR_CONSULTA', consultaId: consulta.id },
  })

  return { ok: true, id: consulta.id }
}

/**
 * Salva a edição médica de uma evolução (`textoEditado`). A versão gerada pela
 * IA (`textoGerado`) é preservada. Multi-tenant: só evoluções do próprio médico.
 */
export async function salvarEvolucaoEditada(
  evolucaoId: string,
  textoEditado: string,
): Promise<ResultadoAcao> {
  const user = await exigirUsuario()

  const texto = textoEditado.trim()
  if (!texto) return { ok: false, erro: 'A evolução não pode ficar vazia.' }
  if (texto.length > TAMANHO_MAXIMO_EVOLUCAO) {
    return { ok: false, erro: 'Texto muito longo.' }
  }

  const res = await prismaClinico.evolucao.updateMany({
    where: { id: evolucaoId, consulta: { usuarioAuthId: user.id, excluidoEm: null } },
    data: { textoEditado: texto },
  })
  if (res.count === 0) return { ok: false, erro: 'Evolução não encontrada.' }

  const evolucao = await prismaClinico.evolucao.findUnique({
    where: { id: evolucaoId },
    select: { consultaId: true },
  })
  if (evolucao) {
    await prismaClinico.logAcesso.create({
      data: { usuarioAuthId: user.id, acao: 'EDITAR_EVOLUCAO', consultaId: evolucao.consultaId },
    })
    revalidatePath(`/consultas/${evolucao.consultaId}`)
  }
  return { ok: true }
}

/**
 * Marca a consulta como revisada pelo médico (status REVISADO). Revisão médica
 * é obrigatória antes do uso do prontuário. Multi-tenant.
 */
export async function marcarConsultaRevisada(consultaId: string): Promise<ResultadoAcao> {
  const user = await exigirUsuario()

  const res = await prismaClinico.consulta.updateMany({
    where: { id: consultaId, usuarioAuthId: user.id, excluidoEm: null, status: 'RASCUNHO' },
    data: { status: 'REVISADO' },
  })
  if (res.count === 0) {
    return { ok: false, erro: 'Consulta não encontrada ou já revisada.' }
  }

  const agora = new Date()
  await prismaClinico.evolucao.updateMany({
    where: { consultaId },
    data: { revisadoPeloMedico: true, revisadoEm: agora },
  })
  await prismaClinico.logAcesso.create({
    data: { usuarioAuthId: user.id, acao: 'REVISAR_CONSULTA', consultaId },
  })
  revalidatePath(`/consultas/${consultaId}`)
  return { ok: true }
}

/**
 * Salva as preferencias de personalizacao do medico (especialidade, instrucoes
 * livres p/ a IA, formato padrao). Upsert por `usuarioAuthId`. Sem dado de
 * paciente — apenas configuracao que sera injetada no prompt de estruturacao.
 */
export async function salvarPreferencias(entrada: PreferenciasInput): Promise<ResultadoAcao> {
  const user = await exigirUsuario()

  const analise = preferenciasSchema.safeParse(entrada)
  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { especialidade, instrucoesCustom, formatoPadrao } = analise.data
  const dados = {
    especialidade: especialidade?.trim() ? especialidade.trim() : null,
    instrucoesCustom: instrucoesCustom?.trim() ? instrucoesCustom.trim() : null,
    formatoPadrao,
  }

  await prismaClinico.preferenciasMedico.upsert({
    where: { usuarioAuthId: user.id },
    create: { usuarioAuthId: user.id, ...dados },
    update: dados,
  })

  await prismaClinico.logAcesso.create({
    data: { usuarioAuthId: user.id, acao: 'SALVAR_PREFERENCIAS' },
  })

  revalidatePath('/preferencias')
  return { ok: true }
}

/**
 * Exclui uma consulta (soft-delete: marca `excluidoEm`). Reversível e some das
 * listagens (que filtram `excluidoEm: null`). Multi-tenant: só consultas do
 * próprio médico.
 */
export async function excluirConsulta(consultaId: string): Promise<ResultadoAcao> {
  const user = await exigirUsuario()

  const res = await prismaClinico.consulta.updateMany({
    where: { id: consultaId, usuarioAuthId: user.id, excluidoEm: null },
    data: { excluidoEm: new Date() },
  })
  if (res.count === 0) {
    return { ok: false, erro: 'Consulta não encontrada ou já excluída.' }
  }

  await prismaClinico.logAcesso.create({
    data: { usuarioAuthId: user.id, acao: 'EXCLUIR_CONSULTA', consultaId },
  })
  revalidatePath('/consultas')
  return { ok: true }
}

export type ResultadoDocumento = { ok: true; texto: string } | { ok: false; erro: string }

/**
 * Gera um documento clinico derivado (atestado, receita, exames, etc.) a
 * partir da EstruturaClinica ja persistida na consulta. Render deterministico,
 * sem nova chamada de IA. Multi-tenant. Rascunho para revisao medica.
 */
export async function gerarDocumento(
  consultaId: string,
  tipo: TipoDocumento,
  opcoes?: OpcoesAtestado,
): Promise<ResultadoDocumento> {
  const user = await exigirUsuario()

  const consulta = await prismaClinico.consulta.findFirst({
    where: { id: consultaId, usuarioAuthId: user.id, excluidoEm: null },
    select: {
      pacienteIniciais: true,
      criadoEm: true,
      evolucoes: { select: { dadosEstruturados: true }, take: 1 },
    },
  })
  if (!consulta) return { ok: false, erro: 'Consulta não encontrada.' }

  const dados = consulta.evolucoes[0]?.dadosEstruturados
  const estrutura = estruturaClinicaSchema.safeParse(dados)
  if (!estrutura.success) {
    return { ok: false, erro: 'Estrutura clínica indisponível. Gere a evolução primeiro.' }
  }

  const opcoesSeguras: OpcoesAtestado | undefined = opcoes
    ? {
        dias:
          typeof opcoes.dias === 'number' && opcoes.dias > 0 && opcoes.dias <= 365
            ? Math.floor(opcoes.dias)
            : undefined,
        incluirCid: Boolean(opcoes.incluirCid),
        observacao: opcoes.observacao?.slice(0, 500),
      }
    : undefined

  const texto = renderizarDocumento(
    tipo,
    estrutura.data,
    { pacienteIniciais: consulta.pacienteIniciais, data: consulta.criadoEm },
    opcoesSeguras,
  )

  await prismaClinico.logAcesso.create({
    data: { usuarioAuthId: user.id, acao: `GERAR_DOC_${tipo}`, consultaId },
  })

  return { ok: true, texto }
}
