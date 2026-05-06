import * as Speech from 'expo-speech'

export type FalaArgs = {
  vignette?: string | null
  enunciado: string
  alternativas?: Array<{ letra: string; texto: string }>
  velocidade?: number // 0.5..2.0 (default 1.0)
}

export type FalaCallbacks = {
  onStart?: () => void
  onDone?: () => void
  onStopped?: () => void
  onError?: (e: Error) => void
}

const VOZ_PT = 'pt-BR'

/**
 * Lê uma questão completa em sequência: vinheta → pergunta → alternativas.
 * Aguarda cada bloco terminar antes de iniciar o próximo.
 */
export async function falarQuestao(args: FalaArgs, cbs: FalaCallbacks = {}): Promise<void> {
  const blocos: string[] = []
  if (args.vignette) blocos.push(`Caso clínico. ${args.vignette}`)
  blocos.push(`Pergunta. ${args.enunciado}`)
  if (args.alternativas && args.alternativas.length > 0) {
    blocos.push('Alternativas.')
    for (const a of args.alternativas) {
      blocos.push(`Alternativa ${a.letra}. ${a.texto}`)
    }
  }

  cbs.onStart?.()
  try {
    for (const bloco of blocos) {
      await falarBloco(bloco, args.velocidade ?? 1.0)
    }
    cbs.onDone?.()
  } catch (e) {
    cbs.onError?.(e as Error)
  }
}

function falarBloco(texto: string, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    Speech.speak(texto, {
      language: VOZ_PT,
      rate,
      pitch: 1.0,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: (e) => reject(e instanceof Error ? e : new Error(String(e))),
    })
  })
}

export function pararFala(): void {
  Speech.stop()
}

export function estaFalando(): Promise<boolean> {
  return Speech.isSpeakingAsync()
}
