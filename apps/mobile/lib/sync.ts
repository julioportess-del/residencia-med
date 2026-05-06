import AsyncStorage from '@react-native-async-storage/async-storage'

const FILA_KEY = 'residencia-med:fila-respostas'

export type RespostaPendente = {
  id: string // uuid local
  questaoId: string
  alternativaLetra: string
  tempoSegundos: number
  confianca?: 'CHUTE' | 'INCERTO' | 'CONFIANTE'
  sessaoId?: string
  modoRevisao: boolean
  criadoEm: string // ISO
}

export async function enfileirarResposta(r: RespostaPendente): Promise<void> {
  const atual = await listarFila()
  atual.push(r)
  await AsyncStorage.setItem(FILA_KEY, JSON.stringify(atual))
}

export async function listarFila(): Promise<RespostaPendente[]> {
  const raw = await AsyncStorage.getItem(FILA_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as RespostaPendente[]
  } catch {
    return []
  }
}

export async function removerDaFila(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const set = new Set(ids)
  const atual = await listarFila()
  const restante = atual.filter((r) => !set.has(r.id))
  await AsyncStorage.setItem(FILA_KEY, JSON.stringify(restante))
}

export async function limparFila(): Promise<void> {
  await AsyncStorage.removeItem(FILA_KEY)
}

/**
 * Estrategia: server-wins. Tentamos enviar; se 4xx (questao invalida, ja respondida),
 * descartamos local. Se 5xx, mantemos pra retentar.
 */
export type Sincronizador = (r: RespostaPendente) => Promise<{ enviado: boolean; persistente: boolean }>

export async function sincronizarFila(env: Sincronizador): Promise<{ enviadas: number; pendentes: number }> {
  const atual = await listarFila()
  const sucessos: string[] = []
  const descartar: string[] = []

  for (const r of atual) {
    try {
      const res = await env(r)
      if (res.enviado) sucessos.push(r.id)
      else if (!res.persistente) descartar.push(r.id)
    } catch {
      // mantem pra retentar
    }
  }

  const remover = [...sucessos, ...descartar]
  await removerDaFila(remover)

  const pendentes = atual.length - remover.length
  return { enviadas: sucessos.length, pendentes }
}
