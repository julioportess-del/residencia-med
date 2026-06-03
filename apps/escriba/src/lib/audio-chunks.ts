// Corta um áudio gravado em chunks WAV de 16 kHz mono, pequenos o bastante para
// caber no limite de corpo da Vercel (4,5 MB) e serem transcritos em < 60 s.
// Tudo roda NO NAVEGADOR — o áudio completo nunca sai do dispositivo (LGPD).

const TAXA_ALVO = 16000 // Whisper trabalha em 16 kHz
const SEGUNDOS_POR_CHUNK = 90 // 90 s @ 16 kHz mono 16-bit ≈ 2,9 MB (< 4,5 MB)

interface AudioContextCtor {
  new (): AudioContext
}

function obterAudioContext(): AudioContext {
  const w = window as unknown as {
    AudioContext?: AudioContextCtor
    webkitAudioContext?: AudioContextCtor
  }
  const Ctor = w.AudioContext ?? w.webkitAudioContext
  if (!Ctor) throw new Error('Web Audio API indisponível neste navegador.')
  return new Ctor()
}

/**
 * Decodifica o Blob, reamostra para 16 kHz mono e devolve uma lista de Blobs WAV
 * (um por trecho de ~90 s). Quantidade de chunks cresce com a duração.
 */
export async function audioParaChunksWav(blob: Blob): Promise<Blob[]> {
  const arrayBuffer = await blob.arrayBuffer()

  const ctx = obterAudioContext()
  const decodificado = await ctx.decodeAudioData(arrayBuffer)
  await ctx.close()

  // Reamostra para 16 kHz mono via OfflineAudioContext.
  const totalAmostras = Math.ceil(decodificado.duration * TAXA_ALVO)
  const offline = new OfflineAudioContext(1, Math.max(1, totalAmostras), TAXA_ALVO)
  const fonte = offline.createBufferSource()
  fonte.buffer = decodificado
  fonte.connect(offline.destination)
  fonte.start()
  const reamostrado = await offline.startRendering()
  const amostras = reamostrado.getChannelData(0)

  const amostrasPorChunk = SEGUNDOS_POR_CHUNK * TAXA_ALVO
  const chunks: Blob[] = []
  for (let i = 0; i < amostras.length; i += amostrasPorChunk) {
    const fatia = amostras.subarray(i, Math.min(i + amostrasPorChunk, amostras.length))
    chunks.push(codificarWav(fatia, TAXA_ALVO))
  }
  return chunks.length > 0 ? chunks : [codificarWav(amostras, TAXA_ALVO)]
}

/** Codifica Float32 PCM em um Blob WAV (16-bit mono). */
function codificarWav(amostras: Float32Array, taxa: number): Blob {
  const buffer = new ArrayBuffer(44 + amostras.length * 2)
  const view = new DataView(buffer)

  const escreverTexto = (offset: number, texto: string) => {
    for (let i = 0; i < texto.length; i++) view.setUint8(offset + i, texto.charCodeAt(i))
  }

  escreverTexto(0, 'RIFF')
  view.setUint32(4, 36 + amostras.length * 2, true)
  escreverTexto(8, 'WAVE')
  escreverTexto(12, 'fmt ')
  view.setUint32(16, 16, true) // tamanho do bloco fmt
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, taxa, true)
  view.setUint32(28, taxa * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits por amostra
  escreverTexto(36, 'data')
  view.setUint32(40, amostras.length * 2, true)

  let offset = 44
  for (let i = 0; i < amostras.length; i++) {
    const s = Math.max(-1, Math.min(1, amostras[i] ?? 0))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }
  return new Blob([view], { type: 'audio/wav' })
}
