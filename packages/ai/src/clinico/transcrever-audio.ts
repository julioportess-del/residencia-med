import { createHash } from 'node:crypto'
import { toFile } from 'openai/uploads'
import { openai } from '../clients'
import { chaveCacheLLM, getCache, setCache } from '../cache'

const MODELO_WHISPER =
  process.env.OPENAI_TRANSCRIBE_MODEL ?? process.env.OPENAI_WHISPER_MODEL ?? 'whisper-1'
const VERSAO_TRANSCRICAO = '2026-06-01.1'

export class TranscricaoVaziaError extends Error {
  constructor() {
    super('A transcricao retornou vazia. Verifique se o audio captou voz.')
    this.name = 'TranscricaoVaziaError'
  }
}

/**
 * Transcreve audio de consulta via Whisper (whisper-1, zero-retention).
 *
 * Privacidade: o audio NUNCA e persistido. Recebe os bytes em memoria,
 * envia ao Whisper e descarta. So o texto retorna. Cache por hash do audio
 * evita reprocessar o mesmo arquivo (ex.: retry de pipeline).
 *
 * @param audio bytes do arquivo de audio (ex.: webm/opus do MediaRecorder)
 * @param nomeArquivo nome com extensao p/ o Whisper inferir o formato
 */
export async function transcreverAudio(
  audio: Buffer | Uint8Array,
  nomeArquivo = 'consulta.webm',
): Promise<string> {
  const bytes = Buffer.isBuffer(audio) ? audio : Buffer.from(audio)
  const hashAudio = createHash('sha256').update(bytes).digest('hex')

  const chave = chaveCacheLLM({
    funcao: 'transcreverAudio',
    args: { hashAudio },
    modelo: MODELO_WHISPER,
    versaoPrompt: VERSAO_TRANSCRICAO,
  })

  const cacheado = await getCache<string>(chave)
  if (cacheado !== null) return cacheado

  const arquivo = await toFile(bytes, nomeArquivo)

  const resposta = await openai.audio.transcriptions.create({
    file: arquivo,
    model: MODELO_WHISPER,
    language: 'pt',
    // 'text' devolve string crua, sem timestamps — suficiente p/ estruturar.
    response_format: 'text',
  })

  // Com response_format 'text', o SDK retorna a string diretamente.
  const texto = (typeof resposta === 'string' ? resposta : String(resposta)).trim()

  if (!texto) throw new TranscricaoVaziaError()

  await setCache(chave, texto)
  return texto
}
