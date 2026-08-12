// Cópia adaptada de apps/escriba/src/lib/audio-chunks.ts — manter em sincronia.
// Corta o áudio gravado em chunks WAV 16 kHz mono (< 4,5 MB por chunk).
// Roda no offscreen document — o áudio completo nunca sai do dispositivo (LGPD).

const TAXA_ALVO = 16000
export const SEGUNDOS_POR_CHUNK = 90

export async function audioParaChunksWav(blob: Blob): Promise<Blob[]> {
  const arrayBuffer = await blob.arrayBuffer()

  const ctx = new AudioContext()
  const decodificado = await ctx.decodeAudioData(arrayBuffer)
  await ctx.close()

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
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, taxa, true)
  view.setUint32(28, taxa * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
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
