import {
  CapacidadeNaoSuportadaError,
  type AgendamentoExterno,
  type CapacidadesProntuario,
  type PacienteExterno,
  type PdfParaAnexar,
  type ProntuarioPort,
} from '../contrato'

/**
 * Adapter Feegow (docs.feegow.com, API v1). Fatos confirmados na pesquisa
 * de 2026-08:
 * - Auth: token estático POR CLÍNICA no header `x-access-token` (JWT),
 *   gerado pelo usuário master em Configurações → Outras Configurações →
 *   API Pública. Rate limit ~60 req/min.
 * - TEM: busca de paciente (inclusive por CPF), agenda, upload de PDF
 *   (`/patient/upload-base64`).
 * - NÃO TEM: leitura/escrita da evolução clínica (texto entra só pela UI —
 *   por isso `inserirTextoEvolucao: 'extensao-dom'`), webhooks, OAuth/SSO.
 */

const BASE_URL = 'https://api.feegow.com/v1/api'

interface OpcoesFeegow {
  token: string
  /** ID do profissional no Feegow (filtra a agenda). */
  profissionalId?: number
  fetchFn?: typeof fetch
}

function somenteDigitos(s: string): string {
  return s.replace(/\D/g, '')
}

/** DD-MM-YYYY exigido pela API do Feegow, a partir de YYYY-MM-DD. */
function dataFeegow(isoDate: string): string {
  const [ano, mes, dia] = isoDate.split('-')
  return `${dia}-${mes}-${ano}`
}

export class FeegowAdapter implements ProntuarioPort {
  readonly sistema = 'FEEGOW' as const
  private readonly token: string
  private readonly profissionalId?: number
  private readonly fetchFn: typeof fetch

  constructor(opts: OpcoesFeegow) {
    this.token = opts.token
    this.profissionalId = opts.profissionalId
    this.fetchFn = opts.fetchFn ?? fetch
  }

  capacidades(): CapacidadesProntuario {
    return {
      agendaDoDia: true,
      buscarPacientePorCpf: true,
      anexarPdf: true,
      inserirTextoEvolucao: 'extensao-dom',
      deteccaoContextoAberto: true,
    }
  }

  private async chamar<T>(
    caminho: string,
    init?: { metodo?: 'GET' | 'POST'; corpo?: unknown },
  ): Promise<T> {
    const resp = await this.fetchFn(`${BASE_URL}${caminho}`, {
      method: init?.metodo ?? 'GET',
      headers: {
        'x-access-token': this.token,
        ...(init?.corpo ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(init?.corpo ? { body: JSON.stringify(init.corpo) } : {}),
    })
    if (!resp.ok) {
      throw new Error(`Feegow API ${caminho} respondeu HTTP ${resp.status}`)
    }
    return (await resp.json()) as T
  }

  async agendaDoDia(data: string): Promise<AgendamentoExterno[]> {
    const d = dataFeegow(data)
    const filtroProf = this.profissionalId ? `&profissional_id=${this.profissionalId}` : ''
    const resposta = await this.chamar<{
      content?: Array<{
        agendamento_id?: number | string
        paciente_id?: number | string
        nome?: string
        paciente_nome?: string
        horario?: string
        data?: string
        status_id?: number | string
        telemedicina?: boolean
      }>
    }>(`/appoints/search?data_start=${d}&data_end=${d}${filtroProf}`)

    const itens = Array.isArray(resposta.content) ? resposta.content : []
    return itens.map((a) => ({
      idExterno: String(a.agendamento_id ?? ''),
      paciente: {
        idExterno: String(a.paciente_id ?? ''),
        nomeCompleto: a.paciente_nome ?? a.nome ?? '',
      },
      inicio: `${data}T${(a.horario ?? '00:00').slice(0, 5)}:00`,
      status: a.status_id != null ? String(a.status_id) : undefined,
      telemedicina: a.telemedicina,
    }))
  }

  async buscarPacientePorCpf(cpf: string): Promise<PacienteExterno | null> {
    const resposta = await this.chamar<{
      content?: Array<{
        paciente_id?: number | string
        id?: number | string
        nome_completo?: string
        nome?: string
        nascimento?: string
        documentos?: { cpf?: string }
      }>
    }>(`/patient/search?paciente_cpf=${somenteDigitos(cpf)}`)

    const p = Array.isArray(resposta.content) ? resposta.content[0] : undefined
    if (!p) return null
    return {
      idExterno: String(p.paciente_id ?? p.id ?? ''),
      nomeCompleto: p.nome_completo ?? p.nome ?? '',
      cpf: p.documentos?.cpf ?? undefined,
      dataNascimento: p.nascimento ?? undefined,
    }
  }

  async anexarPdf(idExternoPaciente: string, pdf: PdfParaAnexar): Promise<{ idArquivo: string }> {
    const resposta = await this.chamar<{ success?: boolean; fileId?: number | string }>(
      '/patient/upload-base64',
      {
        metodo: 'POST',
        corpo: {
          paciente_id: Number(idExternoPaciente),
          base64_file: `data:application/pdf;base64,${pdf.base64}`,
          arquivo_descricao: pdf.descricao,
        },
      },
    )
    if (!resposta.success && resposta.fileId == null) {
      throw new Error('Feegow não confirmou o upload do PDF.')
    }
    return { idArquivo: String(resposta.fileId ?? '') }
  }
}

/** Registro de adapters — ponto único para instanciar por sistema. */
export function criarAdapter(sistema: 'FEEGOW', opts: OpcoesFeegow): ProntuarioPort {
  if (sistema === 'FEEGOW') return new FeegowAdapter(opts)
  throw new CapacidadeNaoSuportadaError(sistema, 'adapter')
}
