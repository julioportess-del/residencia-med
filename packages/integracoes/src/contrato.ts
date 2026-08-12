/**
 * Contrato agnóstico de integração com prontuários eletrônicos (EHRs).
 *
 * Arquitetura: Escriba Health → Integration Layer → adapters (Feegow é o 1º;
 * depois iClinic, Tasy, MV...). Cada adapter DECLARA suas capacidades e o
 * produto degrada graciosamente: sem write-back de texto → extensão DOM;
 * sem extensão → copiar por seção (fallback universal).
 *
 * Regra inegociável: NENHUMA escrita definitiva no EHR sem revisão e
 * confirmação explícita do médico (o adapter recebe conteúdo já revisado).
 */

export type SistemaProntuario = 'FEEGOW'

/** Como o texto da evolução chega ao prontuário do EHR. */
export type ModoInsercaoTexto =
  | 'api' // endpoint oficial de escrita (ideal, raro no BR)
  | 'extensao-dom' // extensão Chrome preenche o campo na UI do EHR
  | 'clipboard' // copiar por seção — fallback universal

export interface CapacidadesProntuario {
  /** Lista consultas do dia do profissional (âncora de contexto). */
  agendaDoDia: boolean
  /** Busca paciente por CPF (reconciliação de identidade). */
  buscarPacientePorCpf: boolean
  /** Anexa PDF ao prontuário do paciente via API oficial. */
  anexarPdf: boolean
  /** Melhor modo disponível de inserir texto da evolução. */
  inserirTextoEvolucao: ModoInsercaoTexto
  /** A extensão consegue detectar o paciente aberto na tela do EHR. */
  deteccaoContextoAberto: boolean
}

export interface PacienteExterno {
  idExterno: string
  nomeCompleto: string
  cpf?: string
  dataNascimento?: string // YYYY-MM-DD
}

export interface AgendamentoExterno {
  idExterno: string
  paciente: PacienteExterno
  inicio: string // ISO
  status?: string
  telemedicina?: boolean
}

export interface PdfParaAnexar {
  nomeArquivo: string
  descricao: string
  /** Conteúdo do PDF em base64 (sem prefixo data:). */
  base64: string
}

/** Erro padrão quando o adapter não suporta a operação (checar capacidades antes). */
export class CapacidadeNaoSuportadaError extends Error {
  constructor(sistema: SistemaProntuario, operacao: string) {
    super(`${sistema} não suporta a operação "${operacao}" via API oficial.`)
    this.name = 'CapacidadeNaoSuportadaError'
  }
}

/**
 * Porta de integração com um EHR. Implementações vivem em `src/adapters/`.
 * Métodos não suportados lançam `CapacidadeNaoSuportadaError` — o chamador
 * DEVE consultar `capacidades()` antes.
 */
export interface ProntuarioPort {
  readonly sistema: SistemaProntuario
  capacidades(): CapacidadesProntuario

  /** Consultas do dia do profissional no EHR. */
  agendaDoDia(data: string): Promise<AgendamentoExterno[]>

  /** Busca paciente por CPF (apenas dígitos). */
  buscarPacientePorCpf(cpf: string): Promise<PacienteExterno | null>

  /** Anexa um PDF (ex.: evolução revisada e assinada) ao prontuário. */
  anexarPdf(idExternoPaciente: string, pdf: PdfParaAnexar): Promise<{ idArquivo: string }>
}
