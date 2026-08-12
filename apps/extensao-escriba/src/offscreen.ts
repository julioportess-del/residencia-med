import { estruturar, transcreverChunk, type Credenciais } from './api'
import { audioParaChunksWav } from './audio-chunks'
import type { EstadoExtensao, MensagemParaOffscreen, Resposta } from './tipos'

/**
 * Offscreen document: dono da gravação. Vive fora da página do Feegow —
 * a gravação sobrevive a reload/troca de aba. Ao finalizar, corta o áudio
 * em chunks WAV e envia ao pipeline do Escriba (áudio nunca persiste).
 */

let recorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let pedacos: Blob[] = []
// Credenciais da API (chegam via OFF_INICIAR — offscreen não lê storage).
let credenciais: Credenciais | null = null

let estado: EstadoExtensao = { estado: 'ocioso', msAcumulados: 0 }

function definirEstado(novo: Partial<EstadoExtensao>): void {
  estado = { ...estado, ...novo }
  // Mantém o background/badge sincronizados (sem aguardar resposta).
  void chrome.runtime.sendMessage({ alvo: 'bg', tipo: 'ATUALIZAR_ESTADO', estado }).catch(() => {})
}

async function iniciar(
  consultaId: string,
  paciente: string,
  creds: Credenciais,
): Promise<Resposta<EstadoExtensao>> {
  if (recorder) return { ok: false, erro: 'Já existe uma gravação em andamento.' }
  credenciais = creds
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    return {
      ok: false,
      erro: 'Microfone não autorizado para a extensão. Abra as opções da extensão Escriba e clique em "Permitir microfone".',
    }
  }

  pedacos = []
  recorder = new MediaRecorder(stream)
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) pedacos.push(e.data)
  }
  recorder.onstop = () => {
    void processar(new Blob(pedacos, { type: recorder?.mimeType || 'audio/webm' }))
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    recorder = null
  }
  recorder.start()

  definirEstado({
    estado: 'gravando',
    consultaId,
    paciente,
    inicioEm: Date.now(),
    msAcumulados: 0,
    erro: undefined,
  })
  return { ok: true, dados: estado }
}

function pausar(): Resposta<EstadoExtensao> {
  if (!recorder || estado.estado !== 'gravando') {
    return { ok: false, erro: 'Nada gravando para pausar.' }
  }
  recorder.pause()
  definirEstado({
    estado: 'pausado',
    msAcumulados: estado.msAcumulados + (Date.now() - (estado.inicioEm ?? Date.now())),
    inicioEm: undefined,
  })
  return { ok: true, dados: estado }
}

function retomar(): Resposta<EstadoExtensao> {
  if (!recorder || estado.estado !== 'pausado') {
    return { ok: false, erro: 'Nada pausado para retomar.' }
  }
  recorder.resume()
  definirEstado({ estado: 'gravando', inicioEm: Date.now() })
  return { ok: true, dados: estado }
}

function finalizar(): Resposta<EstadoExtensao> {
  if (!recorder) return { ok: false, erro: 'Nada gravando para finalizar.' }
  definirEstado({
    estado: 'processando',
    fase: 'cortando',
    msAcumulados:
      estado.estado === 'gravando'
        ? estado.msAcumulados + (Date.now() - (estado.inicioEm ?? Date.now()))
        : estado.msAcumulados,
    inicioEm: undefined,
  })
  recorder.stop() // dispara onstop → processar()
  return { ok: true, dados: estado }
}

function descartar(): Resposta<EstadoExtensao> {
  if (recorder) {
    recorder.onstop = null
    recorder.stop()
    recorder = null
  }
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  pedacos = []
  definirEstado({ estado: 'ocioso', consultaId: undefined, paciente: undefined, msAcumulados: 0 })
  return { ok: true, dados: estado }
}

const CONCORRENCIA = 6

async function processar(blob: Blob): Promise<void> {
  const consultaId = estado.consultaId
  if (!consultaId || !credenciais) return
  const id: string = consultaId
  const creds: Credenciais = credenciais
  try {
    const chunks = await audioParaChunksWav(blob)
    definirEstado({ fase: 'transcrevendo', progresso: { atual: 0, total: chunks.length } })

    const resultados = new Array<string>(chunks.length).fill('')
    let proximo = 0
    let concluidos = 0
    async function worker(): Promise<void> {
      for (;;) {
        const i = proximo++
        const chunk = chunks[i]
        if (i >= chunks.length || !chunk) return
        resultados[i] = await transcreverChunk(creds, id, chunk, i)
        concluidos++
        definirEstado({ progresso: { atual: concluidos, total: chunks.length } })
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCORRENCIA, chunks.length) }, () => worker()))

    const transcricao = resultados.filter(Boolean).join('\n').trim()
    if (!transcricao) {
      definirEstado({ estado: 'erro', erro: 'Não foi possível captar fala no áudio.' })
      return
    }

    definirEstado({ fase: 'estruturando', progresso: undefined })
    await estruturar(creds, id, transcricao)
    definirEstado({ estado: 'pronto', fase: undefined })
  } catch (e) {
    definirEstado({
      estado: 'erro',
      erro: e instanceof Error ? e.message : 'Falha ao processar a gravação.',
    })
  }
}

chrome.runtime.onMessage.addListener((msg: MensagemParaOffscreen, _sender, sendResponse) => {
  if (!msg || typeof msg !== 'object' || msg.alvo !== 'off') return undefined

  switch (msg.tipo) {
    case 'OFF_ESTADO':
      sendResponse({ ok: true, dados: estado })
      return undefined
    case 'OFF_INICIAR':
      void iniciar(msg.consultaId, msg.paciente, {
        token: msg.token,
        base: msg.apiBase,
      }).then(sendResponse)
      return true
    case 'OFF_PAUSAR':
      sendResponse(pausar())
      return undefined
    case 'OFF_RETOMAR':
      sendResponse(retomar())
      return undefined
    case 'OFF_FINALIZAR':
      sendResponse(finalizar())
      return undefined
    case 'OFF_DESCARTAR':
      sendResponse(descartar())
      return undefined
  }
})
