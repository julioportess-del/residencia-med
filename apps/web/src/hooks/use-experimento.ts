'use client'

import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

/**
 * Hook React para A/B test.
 *
 * - Atribui variante na primeira renderização (idempotente do lado do servidor)
 * - Devolve `variante: null` enquanto carrega ou se o experimento estiver inativo
 * - `registrar(evento)` envia evento associado à variante atribuída
 *
 * Uso típico:
 *   const { variante, registrar } = useExperimento('precos-cta')
 *   if (variante === 'B') { ... }
 *   onClick={() => registrar('click')}
 */
export function useExperimento(chave: string) {
  const [variante, setVariante] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const atribuir = trpc.experimentos.atribuir.useMutation()
  const registrarMut = trpc.experimentos.registrarEvento.useMutation()

  useEffect(() => {
    let ativo = true
    atribuir
      .mutateAsync({ chave })
      .then((r) => {
        if (!ativo) return
        setVariante(r.variante)
      })
      .catch(() => {
        if (!ativo) return
        setVariante(null)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  const registrar = (evento: string, metadata?: Record<string, unknown>) => {
    registrarMut.mutate({ chave, evento, metadata })
  }

  return { variante, carregando, registrar }
}
