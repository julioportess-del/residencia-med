/** Protocolo de mensagens content ↔ background ↔ offscreen. */

export type EstadoGravacao = 'ocioso' | 'gravando' | 'pausado' | 'processando' | 'pronto' | 'erro'

export interface SecaoTexto {
  chave: string
  titulo: string
  texto: string
}

export interface EstadoExtensao {
  estado: EstadoGravacao
  consultaId?: string
  paciente?: string
  /** epoch ms do início/retomada da gravação (para o timer no widget). */
  inicioEm?: number
  /** ms acumulados antes da última pausa. */
  msAcumulados: number
  fase?: 'cortando' | 'transcrevendo' | 'estruturando'
  progresso?: { atual: number; total: number }
  erro?: string
}

export type MensagemParaBg =
  | { alvo: 'bg'; tipo: 'ESTADO' }
  | {
      alvo: 'bg'
      tipo: 'INICIAR'
      paciente: string
      tipoAtendimento: string
    }
  | { alvo: 'bg'; tipo: 'PAUSAR' }
  | { alvo: 'bg'; tipo: 'RETOMAR' }
  | { alvo: 'bg'; tipo: 'FINALIZAR' }
  | { alvo: 'bg'; tipo: 'DESCARTAR' }
  | { alvo: 'bg'; tipo: 'BUSCAR_RESULTADO'; consultaId: string }

export type MensagemParaOffscreen =
  | { alvo: 'off'; tipo: 'OFF_INICIAR'; consultaId: string; paciente: string }
  | { alvo: 'off'; tipo: 'OFF_PAUSAR' }
  | { alvo: 'off'; tipo: 'OFF_RETOMAR' }
  | { alvo: 'off'; tipo: 'OFF_FINALIZAR' }
  | { alvo: 'off'; tipo: 'OFF_DESCARTAR' }
  | { alvo: 'off'; tipo: 'OFF_ESTADO' }

/** Offscreen → background: atualização de estado para persistir/badge. */
export interface AvisoEstado {
  alvo: 'bg'
  tipo: 'ATUALIZAR_ESTADO'
  estado: EstadoExtensao
}

export interface RespostaOk<T> {
  ok: true
  dados: T
}
export interface RespostaErro {
  ok: false
  erro: string
}
export type Resposta<T> = RespostaOk<T> | RespostaErro

export interface ResultadoConsulta {
  id: string
  status: string
  paciente: string
  prontuario: string | null
  secoes: SecaoTexto[]
}
