'use server'

import { revalidatePath } from 'next/cache'
import { prismaClinico } from '@residencia-med/db-clinico'
import {
  estruturaClinicaSchema,
  renderizarDocumento,
  renderizarModelo,
  type TipoDocumento,
  type OpcoesAtestado,
} from '@residencia-med/ai/clinico'
import { exigirUsuario } from '@/lib/auth'
import { resumoUltimaConsulta, type ResumoRetorno } from '@/server/retorno'
import {
  novaConsultaSchema,
  preferenciasSchema,
  pacienteSchema,
  modeloSchema,
  type NovaConsultaInput,
  type PreferenciasInput,
  type PacienteInput,
  type ModeloInput,
} from '@/lib/validacao'

export type ResultadoCriarConsulta = { ok: true; id: string } | { ok: false; erro: string }

export type ResultadoAcao = { ok: true } | { ok: false; erro: string }

export type ResultadoCriarPaciente = { ok: true; id: string } | { ok: false; erro: string }

/** Garante que o médico ativou o cadastro de pacientes (opt-in LGPD). */
async function exigirCadastroAtivo(usuarioAuthId: string): Promise<boolean> {
  const pref = await prismaClinico.preferenciasMedico.findUnique({
    where: { usuarioAuthId },
    select: { cadastroPacientesAtivo: true },
  })
  return Boolean(pref?.cadastroPacientesAtivo)
}

function dataDeTexto(valor?: string): Date | null {
  if (!valor) return null
  const d = new Date(`${valor}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function limpo(valor?: string): string | null {
  const t = valor?.trim()
  return t ? t : null
}

const TAMANHO_MAXIMO_EVOLUCAO = 20_000

/** Cria uma consulta em GRAVANDO. Sem nome/CPF — apenas iniciais (LGPD). */
export async function criarConsulta(entrada: NovaConsultaInput): Promise<ResultadoCriarConsulta> {
  const user = await exigirUsuario()

  const analise = novaConsultaSchema.safeParse(entrada)
  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { pacienteIniciais, tipoConsulta, tipoAtendimento, pacienteId, modeloId } = analise.data

  // Vínculo opcional a um paciente cadastrado — valida posse (multi-tenant).
  let vinculoId: string | null = null
  let iniciais = pacienteIniciais.trim()
  if (pacienteId) {
    const paciente = await prismaClinico.paciente.findFirst({
      where: { id: pacienteId, usuarioAuthId: user.id, excluidoEm: null },
      select: { id: true, nomeCompleto: true },
    })
    if (!paciente) return { ok: false, erro: 'Paciente não encontrado.' }
    vinculoId = paciente.id
    iniciais = paciente.nomeCompleto
  }

  // Modelo opcional — próprio ou da plataforma.
  let vinculoModeloId: string | null = null
  if (modeloId) {
    const modelo = await prismaClinico.modelo.findFirst({
      where: {
        id: modeloId,
        excluidoEm: null,
        OR: [{ usuarioAuthId: user.id }, { isPublico: true }],
      },
      select: { id: true },
    })
    if (!modelo) return { ok: false, erro: 'Modelo não encontrado.' }
    vinculoModeloId = modelo.id
  }

  const consulta = await prismaClinico.consulta.create({
    data: {
      usuarioAuthId: user.id,
      pacienteIniciais: iniciais,
      pacienteId: vinculoId,
      modeloId: vinculoModeloId,
      tipoConsulta,
      tipoAtendimento,
      status: 'GRAVANDO',
      consentimentoConfirmado: true,
      consentimentoEm: new Date(),
    },
    select: { id: true },
  })

  // Contabiliza o uso do modelo.
  if (vinculoModeloId) {
    await prismaClinico.modelo
      .update({
        where: { id: vinculoModeloId },
        data: { usosCount: { increment: 1 }, ultimoUsoEm: new Date() },
      })
      .catch(() => undefined)
  }

  await prismaClinico.logAcesso.create({
    data: { usuarioAuthId: user.id, acao: 'CRIAR_CONSULTA', consultaId: consulta.id },
  })

  return { ok: true, id: consulta.id }
}

/**
 * Resumo da última consulta do paciente (retorno inteligente) — chamado
 * pelo formulário de nova consulta quando o médico seleciona "Retorno".
 */
export async function buscarResumoRetorno(pacienteId: string): Promise<ResumoRetorno | null> {
  const user = await exigirUsuario()
  if (!pacienteId.trim()) return null
  return resumoUltimaConsulta(user.id, pacienteId)
}

/** Cria um paciente (opt-in). Exige cadastro ativo + consentimento. Multi-tenant. */
export async function criarPaciente(entrada: PacienteInput): Promise<ResultadoCriarPaciente> {
  const user = await exigirUsuario()
  if (!(await exigirCadastroAtivo(user.id))) {
    return { ok: false, erro: 'Ative o cadastro de pacientes nas Preferências primeiro.' }
  }
  const analise = pacienteSchema.safeParse(entrada)
  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const d = analise.data
  if (!d.consentimentoCadastro) {
    return { ok: false, erro: 'Confirme o consentimento do paciente para registrar os dados.' }
  }

  const paciente = await prismaClinico.paciente.create({
    data: {
      usuarioAuthId: user.id,
      nomeCompleto: d.nomeCompleto.trim(),
      dataNascimento: dataDeTexto(d.dataNascimento),
      cpf: limpo(d.cpf),
      email: limpo(d.email),
      telefone: limpo(d.telefone),
      endereco: limpo(d.endereco),
      alergias: d.alergias,
      medicamentos: d.medicamentos,
      condicoesCronicas: d.condicoesCronicas,
      antecedentes: limpo(d.antecedentes),
      consentimentoCadastro: true,
      consentimentoEm: new Date(),
    },
    select: { id: true },
  })
  await prismaClinico.logAcesso.create({
    data: { usuarioAuthId: user.id, acao: 'CRIAR_PACIENTE' },
  })
  revalidatePath('/pacientes')
  return { ok: true, id: paciente.id }
}

/** Atualiza os dados de um paciente. Multi-tenant. Preserva o consentimento. */
export async function atualizarPaciente(
  id: string,
  entrada: PacienteInput,
): Promise<ResultadoAcao> {
  const user = await exigirUsuario()
  const analise = pacienteSchema.safeParse(entrada)
  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const d = analise.data
  const res = await prismaClinico.paciente.updateMany({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    data: {
      nomeCompleto: d.nomeCompleto.trim(),
      dataNascimento: dataDeTexto(d.dataNascimento),
      cpf: limpo(d.cpf),
      email: limpo(d.email),
      telefone: limpo(d.telefone),
      endereco: limpo(d.endereco),
      alergias: d.alergias,
      medicamentos: d.medicamentos,
      condicoesCronicas: d.condicoesCronicas,
      antecedentes: limpo(d.antecedentes),
    },
  })
  if (res.count === 0) return { ok: false, erro: 'Paciente não encontrado.' }
  await prismaClinico.logAcesso.create({
    data: { usuarioAuthId: user.id, acao: 'EDITAR_PACIENTE' },
  })
  revalidatePath(`/pacientes/${id}`)
  revalidatePath('/pacientes')
  return { ok: true }
}

/** Exclui um paciente (soft-delete). As consultas vinculadas são desvinculadas. */
export async function excluirPaciente(id: string): Promise<ResultadoAcao> {
  const user = await exigirUsuario()
  const res = await prismaClinico.paciente.updateMany({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    data: { excluidoEm: new Date() },
  })
  if (res.count === 0) return { ok: false, erro: 'Paciente não encontrado.' }
  await prismaClinico.logAcesso.create({
    data: { usuarioAuthId: user.id, acao: 'EXCLUIR_PACIENTE' },
  })
  revalidatePath('/pacientes')
  return { ok: true }
}

export type ResultadoCriarModelo = { ok: true; id: string } | { ok: false; erro: string }

/** Cria um modelo do médico (template que guia a IA). Multi-tenant. */
export async function criarModelo(entrada: ModeloInput): Promise<ResultadoCriarModelo> {
  const user = await exigirUsuario()
  const analise = modeloSchema.safeParse(entrada)
  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const d = analise.data
  const modelo = await prismaClinico.modelo.create({
    data: {
      usuarioAuthId: user.id,
      nome: d.nome.trim(),
      especialidade: limpo(d.especialidade),
      tipoDocumento: d.tipoDocumento,
      instrucoes: d.instrucoes.trim(),
      formatoBase: d.formatoBase,
      isPublico: false,
    },
    select: { id: true },
  })
  await prismaClinico.logAcesso.create({ data: { usuarioAuthId: user.id, acao: 'CRIAR_MODELO' } })
  revalidatePath('/modelos')
  return { ok: true, id: modelo.id }
}

/** Atualiza um modelo PRÓPRIO. Modelos da plataforma não são editáveis. */
export async function atualizarModelo(id: string, entrada: ModeloInput): Promise<ResultadoAcao> {
  const user = await exigirUsuario()
  const analise = modeloSchema.safeParse(entrada)
  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const d = analise.data
  const res = await prismaClinico.modelo.updateMany({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    data: {
      nome: d.nome.trim(),
      especialidade: limpo(d.especialidade),
      tipoDocumento: d.tipoDocumento,
      instrucoes: d.instrucoes.trim(),
      formatoBase: d.formatoBase,
    },
  })
  if (res.count === 0) return { ok: false, erro: 'Modelo não encontrado ou não editável.' }
  revalidatePath(`/modelos/${id}`)
  revalidatePath('/modelos')
  return { ok: true }
}

/** Exclui (soft-delete) um modelo PRÓPRIO. */
export async function excluirModelo(id: string): Promise<ResultadoAcao> {
  const user = await exigirUsuario()
  const res = await prismaClinico.modelo.updateMany({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    data: { excluidoEm: new Date() },
  })
  if (res.count === 0) return { ok: false, erro: 'Modelo não encontrado ou não removível.' }
  revalidatePath('/modelos')
  return { ok: true }
}

/** Duplica um modelo (próprio ou da plataforma) como um novo modelo do médico. */
export async function duplicarModelo(id: string): Promise<ResultadoCriarModelo> {
  const user = await exigirUsuario()
  const origem = await prismaClinico.modelo.findFirst({
    where: { id, excluidoEm: null, OR: [{ usuarioAuthId: user.id }, { isPublico: true }] },
  })
  if (!origem) return { ok: false, erro: 'Modelo não encontrado.' }
  const novo = await prismaClinico.modelo.create({
    data: {
      usuarioAuthId: user.id,
      nome: `${origem.nome} (cópia)`.slice(0, 80),
      especialidade: origem.especialidade,
      tipoDocumento: origem.tipoDocumento,
      instrucoes: origem.instrucoes,
      formatoBase: origem.formatoBase,
      isPublico: false,
    },
    select: { id: true },
  })
  revalidatePath('/modelos')
  return { ok: true, id: novo.id }
}

/** Define um modelo PRÓPRIO como padrão (duplique um da plataforma antes, se preciso). */
export async function definirModeloPadrao(id: string): Promise<ResultadoAcao> {
  const user = await exigirUsuario()
  const res = await prismaClinico.modelo.updateMany({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    data: { isPadrao: true },
  })
  if (res.count === 0) {
    return { ok: false, erro: 'Só modelos próprios podem ser padrão. Duplique o modelo primeiro.' }
  }
  await prismaClinico.modelo.updateMany({
    where: { usuarioAuthId: user.id, id: { not: id }, isPadrao: true },
    data: { isPadrao: false },
  })
  revalidatePath('/modelos')
  return { ok: true }
}

/**
 * Salva a edição médica de uma evolução (`textoEditado`). A versão gerada pela
 * IA (`textoGerado`) é preservada. Multi-tenant: só evoluções do próprio médico.
 */
/**
 * Salva o EXAME FÍSICO escrito pelo médico: atualiza a estrutura clínica
 * (objetivo.exameFisico) e regenera o texto das 3 evoluções. Edições
 * manuais do texto inteiro (textoEditado) são preservadas — nesse caso o
 * novo exame físico aparece nas Seções e no texto gerado, não no editado.
 */
export async function salvarExameFisico(
  consultaId: string,
  textoExameFisico: string,
): Promise<ResultadoAcao> {
  const user = await exigirUsuario()

  const texto = textoExameFisico.trim()
  if (texto.length > 4000) {
    return { ok: false, erro: 'Texto do exame físico muito longo (máx. 4000 caracteres).' }
  }

  const consulta = await prismaClinico.consulta.findFirst({
    where: { id: consultaId, usuarioAuthId: user.id, excluidoEm: null },
    select: {
      id: true,
      evolucoes: { select: { id: true, modelo: true, dadosEstruturados: true } },
    },
  })
  if (!consulta) return { ok: false, erro: 'Consulta não encontrada.' }

  const base = consulta.evolucoes.find((e) => e.dadosEstruturados)?.dadosEstruturados
  const parse = estruturaClinicaSchema.safeParse(base)
  if (!parse.success) {
    return { ok: false, erro: 'Esta consulta ainda não tem evolução gerada.' }
  }

  const estrutura = {
    ...parse.data,
    objetivo: { ...parse.data.objetivo, exameFisico: texto || undefined },
  }

  await prismaClinico.$transaction([
    ...consulta.evolucoes.map((ev) =>
      prismaClinico.evolucao.update({
        where: { id: ev.id },
        data: {
          dadosEstruturados: estrutura,
          textoGerado: renderizarModelo(estrutura, ev.modelo),
        },
      }),
    ),
    prismaClinico.logAcesso.create({
      data: { usuarioAuthId: user.id, acao: 'EDITAR_EXAME_FISICO', consultaId: consulta.id },
    }),
  ])

  revalidatePath(`/consultas/${consulta.id}`)
  return { ok: true }
}

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

  const { especialidade, instrucoesCustom, formatoPadrao, cadastroPacientesAtivo } = analise.data

  // Registra a data de aceite no PRIMEIRO opt-in e a preserva depois (auditoria LGPD).
  const atual = await prismaClinico.preferenciasMedico.findUnique({
    where: { usuarioAuthId: user.id },
    select: { cadastroPacientesAceiteEm: true },
  })
  const aceiteEm = cadastroPacientesAtivo
    ? (atual?.cadastroPacientesAceiteEm ?? new Date())
    : (atual?.cadastroPacientesAceiteEm ?? null)

  const dados = {
    especialidade: especialidade?.trim() ? especialidade.trim() : null,
    instrucoesCustom: instrucoesCustom?.trim() ? instrucoesCustom.trim() : null,
    formatoPadrao,
    cadastroPacientesAtivo: Boolean(cadastroPacientesAtivo),
    cadastroPacientesAceiteEm: aceiteEm,
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
  revalidatePath('/dashboard')
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
