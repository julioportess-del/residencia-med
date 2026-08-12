import { buscarConsulta, criarConsulta, lerCredenciais } from './api'
import type {
  AvisoEstado,
  EstadoExtensao,
  MensagemParaBg,
  MensagemParaOffscreen,
  Resposta,
  ResultadoConsulta,
} from './tipos'

/**
 * Service worker (MV3): roteia mensagens do widget, gerencia o offscreen
 * document (onde a gravação vive — sobrevive a reload/troca de aba da
 * página do Feegow) e persiste o último estado em storage.session para o
 * caso do SW ser suspenso.
 */

const ESTADO_OCIOSO: EstadoExtensao = { estado: 'ocioso', msAcumulados: 0 }

async function lerEstado(): Promise<EstadoExtensao> {
  const { estadoGravacao } = await chrome.storage.session.get('estadoGravacao')
  return (estadoGravacao as EstadoExtensao | undefined) ?? ESTADO_OCIOSO
}

async function salvarEstado(estado: EstadoExtensao): Promise<void> {
  await chrome.storage.session.set({ estadoGravacao: estado })
  const texto = estado.estado === 'gravando' ? 'REC' : estado.estado === 'processando' ? '…' : ''
  void chrome.action.setBadgeText({ text: texto })
  if (texto === 'REC') void chrome.action.setBadgeBackgroundColor({ color: '#dc2626' })
}

async function offscreenExiste(): Promise<boolean> {
  const contextos = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  })
  return contextos.length > 0
}

async function garantirOffscreen(): Promise<void> {
  if (await offscreenExiste()) return
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification:
      'Gravar o áudio da consulta com consentimento do paciente; a gravação precisa sobreviver a navegação na página do prontuário.',
  })
}

async function enviarAoOffscreen<T>(msg: MensagemParaOffscreen): Promise<Resposta<T>> {
  try {
    return (await chrome.runtime.sendMessage(msg)) as Resposta<T>
  } catch {
    return { ok: false, erro: 'Gravador indisponível.' }
  }
}

async function tratar(msg: MensagemParaBg): Promise<Resposta<unknown>> {
  switch (msg.tipo) {
    case 'ESTADO': {
      // Offscreen vivo é a fonte de verdade; senão, o último estado salvo.
      if (await offscreenExiste()) {
        const r = await enviarAoOffscreen<EstadoExtensao>({ alvo: 'off', tipo: 'OFF_ESTADO' })
        if (r.ok) return r
      }
      return { ok: true, dados: await lerEstado() }
    }

    case 'INICIAR': {
      const atual = await lerEstado()
      if (atual.estado === 'gravando' || atual.estado === 'pausado') {
        return { ok: false, erro: 'Já existe uma gravação em andamento.' }
      }
      try {
        const creds = await lerCredenciais()
        if (!creds) {
          return { ok: false, erro: 'Extensão não conectada. Abra o popup e cole o token.' }
        }
        const { id } = await criarConsulta(msg.paciente, msg.tipoAtendimento)
        await garantirOffscreen()
        return await enviarAoOffscreen({
          alvo: 'off',
          tipo: 'OFF_INICIAR',
          consultaId: id,
          paciente: msg.paciente,
          token: creds.token,
          apiBase: creds.base,
        })
      } catch (e) {
        return { ok: false, erro: e instanceof Error ? e.message : 'Falha ao criar a consulta.' }
      }
    }

    case 'PAUSAR':
      return enviarAoOffscreen({ alvo: 'off', tipo: 'OFF_PAUSAR' })
    case 'RETOMAR':
      return enviarAoOffscreen({ alvo: 'off', tipo: 'OFF_RETOMAR' })
    case 'FINALIZAR':
      return enviarAoOffscreen({ alvo: 'off', tipo: 'OFF_FINALIZAR' })

    case 'DESCARTAR': {
      await enviarAoOffscreen({ alvo: 'off', tipo: 'OFF_DESCARTAR' })
      await salvarEstado(ESTADO_OCIOSO)
      return { ok: true, dados: ESTADO_OCIOSO }
    }

    case 'BUSCAR_RESULTADO': {
      try {
        const consulta = await buscarConsulta(msg.consultaId)
        return { ok: true, dados: consulta satisfies ResultadoConsulta }
      } catch (e) {
        return { ok: false, erro: e instanceof Error ? e.message : 'Falha ao buscar a consulta.' }
      }
    }
  }
}

chrome.runtime.onMessage.addListener((msg: MensagemParaBg | AvisoEstado, _sender, sendResponse) => {
  if (!msg || typeof msg !== 'object' || msg.alvo !== 'bg') return undefined

  if (msg.tipo === 'ATUALIZAR_ESTADO') {
    void salvarEstado(msg.estado)
    sendResponse({ ok: true })
    return undefined
  }

  void tratar(msg).then(sendResponse)
  return true // resposta assíncrona
})
