/**
 * "Minhas provas": acompanhamento dos processos seletivos do candidato
 * (edital, inscricao, pagamento, logistica, prova, acertos).
 *
 * Funcoes puras — o router so busca os dados e chama daqui.
 */
import { chaveDiaBR } from './painel'

const DIA_MS = 24 * 60 * 60 * 1000

/** Inscricao aberta fechando em ate N dias vira pendencia urgente. */
export const DIAS_URGENCIA_INSCRICAO = 3
/** A partir de N dias da prova, cobra logistica (viagem, hospedagem). */
export const DIAS_ALERTA_LOGISTICA = 30
export const LIMITE_PROXIMAS_PROVAS = 3

export type ProcessoSeletivoDados = {
  id: string
  instituicao: string
  especialidade: string
  editalPublicado: boolean
  inscricaoFeita: boolean
  inscricaoPaga: boolean
  logisticaOrganizada: boolean
  /** Datas de calendario (@db.Date): meia-noite UTC. */
  inicioInscricoes: Date | null
  fimInscricoes: Date | null
  dataProva: Date | null
  provaRealizada: boolean
  acertos: number | null
  totalQuestoes: number | null
}

export type EtapaProcesso =
  | 'AGUARDANDO_EDITAL'
  | 'EDITAL_PUBLICADO'
  | 'INSCRICOES_EM_BREVE'
  | 'INSCRICOES_ABERTAS'
  | 'INSCRICOES_ENCERRADAS'
  | 'INSCRITO'
  | 'PROVA_HOJE'
  | 'PROVA_PASSOU'
  | 'REALIZADA'

export type TipoPendencia =
  | 'FAZER_INSCRICAO'
  | 'PAGAR_INSCRICAO'
  | 'ORGANIZAR_LOGISTICA'
  | 'MARCAR_REALIZADA'
  | 'REGISTRAR_ACERTOS'

export type Pendencia = { tipo: TipoPendencia; mensagem: string; urgente: boolean }

/** YYYY-MM-DD de uma data de calendario (@db.Date), sem conversao de fuso. */
export function chaveData(data: Date): string {
  return data.toISOString().slice(0, 10)
}

/** Dias corridos de hoje (Brasilia) ate a data de calendario. Negativo = ja passou. */
export function diasAteData(data: Date | null | undefined, hoje: Date): number | null {
  if (!data) return null
  const alvo = Date.parse(`${chaveData(data)}T00:00:00Z`)
  const base = Date.parse(`${chaveDiaBR(hoje)}T00:00:00Z`)
  return Math.round((alvo - base) / DIA_MS)
}

function plural(n: number, singular: string, pluralForma: string): string {
  return `${n} ${n === 1 ? singular : pluralForma}`
}

export function etapaProcesso(p: ProcessoSeletivoDados, hoje: Date): EtapaProcesso {
  if (p.provaRealizada) return 'REALIZADA'
  const ateProva = diasAteData(p.dataProva, hoje)
  if (ateProva !== null && ateProva < 0) return 'PROVA_PASSOU'
  if (ateProva === 0) return 'PROVA_HOJE'
  if (p.inscricaoFeita) return 'INSCRITO'

  const ateFim = diasAteData(p.fimInscricoes, hoje)
  if (ateFim !== null && ateFim < 0) return 'INSCRICOES_ENCERRADAS'
  const ateInicio = diasAteData(p.inicioInscricoes, hoje)
  if (ateInicio !== null) return ateInicio > 0 ? 'INSCRICOES_EM_BREVE' : 'INSCRICOES_ABERTAS'
  if (ateFim !== null && p.editalPublicado) return 'INSCRICOES_ABERTAS'
  return p.editalPublicado ? 'EDITAL_PUBLICADO' : 'AGUARDANDO_EDITAL'
}

/** O que o candidato precisa fazer agora neste processo, na ordem do fluxo. */
export function pendenciasProcesso(p: ProcessoSeletivoDados, hoje: Date): Pendencia[] {
  const etapa = etapaProcesso(p, hoje)

  if (etapa === 'REALIZADA') {
    return p.acertos === null
      ? [{ tipo: 'REGISTRAR_ACERTOS', mensagem: 'Registre seus acertos', urgente: false }]
      : []
  }
  if (etapa === 'PROVA_PASSOU') {
    return [{ tipo: 'MARCAR_REALIZADA', mensagem: 'Marque a prova como realizada', urgente: false }]
  }

  const pendencias: Pendencia[] = []
  if (etapa === 'INSCRICOES_ABERTAS') {
    const ateFim = diasAteData(p.fimInscricoes, hoje)
    pendencias.push({
      tipo: 'FAZER_INSCRICAO',
      mensagem:
        ateFim === null
          ? 'Faça a inscrição'
          : ateFim === 0
            ? 'Inscrições fecham hoje'
            : `Inscrições fecham em ${plural(ateFim, 'dia', 'dias')}`,
      urgente: ateFim !== null && ateFim <= DIAS_URGENCIA_INSCRICAO,
    })
  }
  if (p.inscricaoFeita && !p.inscricaoPaga) {
    pendencias.push({ tipo: 'PAGAR_INSCRICAO', mensagem: 'Pague a inscrição', urgente: true })
  }
  const ateProva = diasAteData(p.dataProva, hoje)
  if (
    !p.logisticaOrganizada &&
    p.inscricaoFeita &&
    ateProva !== null &&
    ateProva <= DIAS_ALERTA_LOGISTICA
  ) {
    pendencias.push({
      tipo: 'ORGANIZAR_LOGISTICA',
      mensagem: 'Organize viagem e hospedagem',
      urgente: ateProva <= 7,
    })
  }
  return pendencias
}

export type ProximaProva = {
  id: string
  instituicao: string
  especialidade: string
  /** YYYY-MM-DD */
  dataProva: string
  diasAteProva: number
  etapa: EtapaProcesso
  pendencias: Pendencia[]
}

/** Provas ainda por fazer, da mais proxima para a mais distante. */
export function proximasProvas(
  processos: readonly ProcessoSeletivoDados[],
  hoje: Date,
  limite = LIMITE_PROXIMAS_PROVAS,
): ProximaProva[] {
  return processos
    .flatMap((p): ProximaProva[] => {
      const dias = diasAteData(p.dataProva, hoje)
      if (!p.dataProva || dias === null || dias < 0 || p.provaRealizada) return []
      return [
        {
          id: p.id,
          instituicao: p.instituicao,
          especialidade: p.especialidade,
          dataProva: chaveData(p.dataProva),
          diasAteProva: dias,
          etapa: etapaProcesso(p, hoje),
          pendencias: pendenciasProcesso(p, hoje),
        },
      ]
    })
    .sort((a, b) => a.diasAteProva - b.diasAteProva)
    .slice(0, limite)
}

export function pctAcertos(acertos: number | null, totalQuestoes: number | null): number | null {
  if (acertos === null || !totalQuestoes || totalQuestoes <= 0) return null
  return Math.round((acertos / totalQuestoes) * 100)
}
