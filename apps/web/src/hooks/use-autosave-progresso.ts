'use client'

import { useCallback, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc/client'

type Params = {
  aulaId: string
  duracaoS: number
  concluida: boolean
  /** Intervalo entre saves periódicos (default 15s) */
  intervaloS?: number
  /** Delta mínimo em segundos pra justificar um save (default 10s) */
  deltaMinS?: number
  /** Fração da duração pra considerar aula concluída (default 0.9) */
  limiarConclusao?: number
}

/**
 * Autosave do progresso da aula. Retorna handlers para o player.
 *
 * Estratégia:
 * - `onTimeUpdate` só atualiza um ref — não dispara save a cada tick.
 * - Save acontece em 3 gatilhos:
 *   1. Timer periódico (intervaloS) se o delta >= deltaMinS
 *   2. Pause / ended do player (sempre, se houve avanço)
 *   3. beforeunload (fire-and-forget via sendBeacon-like)
 * - Marca `concluida=true` automaticamente quando passa de limiarConclusao,
 *   e só uma vez (não re-marca a cada tick).
 */
export function useAutosaveProgresso({
  aulaId,
  duracaoS,
  concluida,
  intervaloS = 15,
  deltaMinS = 10,
  limiarConclusao = 0.9,
}: Params) {
  const salvar = trpc.cursos.salvarProgresso.useMutation()
  const marcar = trpc.cursos.marcarConcluida.useMutation()

  const tempoAtualRef = useRef(0)
  const ultimoSalvoRef = useRef(0)
  const marcouRef = useRef(concluida)

  // Mantém ref sincronizado com a prop (caso a query re-fetch mude concluida)
  useEffect(() => {
    marcouRef.current = concluida
  }, [concluida])

  const flush = useCallback(
    (motivo: 'timer' | 'pause' | 'ended' | 'unload') => {
      const atual = Math.floor(tempoAtualRef.current)
      const delta = Math.abs(atual - ultimoSalvoRef.current)
      // No timer, só salva se delta >= deltaMinS. Nos demais, salva sempre
      // que houve algum avanço.
      const limiar = motivo === 'timer' ? deltaMinS : 1
      if (atual <= 0 || delta < limiar) return
      ultimoSalvoRef.current = atual
      salvar.mutate({ aulaId, tempoAssistidoS: atual })

      // Auto-conclusão por limiar — só se ainda não concluída
      if (!marcouRef.current && duracaoS > 0 && atual / duracaoS >= limiarConclusao) {
        marcouRef.current = true
        marcar.mutate({ aulaId, concluida: true })
      }
    },
    [aulaId, deltaMinS, duracaoS, limiarConclusao, salvar, marcar],
  )

  // Timer periódico
  useEffect(() => {
    const id = window.setInterval(() => flush('timer'), intervaloS * 1000)
    return () => window.clearInterval(id)
  }, [flush, intervaloS])

  // Save on unload
  useEffect(() => {
    const handler = () => flush('unload')
    window.addEventListener('beforeunload', handler)
    window.addEventListener('pagehide', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
      window.removeEventListener('pagehide', handler)
    }
  }, [flush])

  const onTimeUpdate = useCallback((e: Event) => {
    const target = e.currentTarget as unknown as { currentTime?: number } | null
    if (target && typeof target.currentTime === 'number') {
      tempoAtualRef.current = target.currentTime
    }
  }, [])

  const onPause = useCallback(() => flush('pause'), [flush])
  const onEnded = useCallback(() => flush('ended'), [flush])

  return { onTimeUpdate, onPause, onEnded }
}
