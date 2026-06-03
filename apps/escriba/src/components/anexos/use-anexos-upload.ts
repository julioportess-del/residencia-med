'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { enviarAnexo, validarArquivo } from '@/lib/anexos'
import { MAX_ANEXOS_POR_TURNO, type CategoriaAnexoTipo } from '@/lib/anexos-tipos'

export type StatusAnexoUI = 'enviando' | 'pronto' | 'erro'

export interface AnexoUI {
  localId: string
  nome: string
  tipoMime: string
  previewUrl?: string // object URL p/ imagens
  status: StatusAnexoUI
  anexoId?: string
  erro?: string
}

interface OpcoesUpload {
  consultaId?: string | null
  categoria?: CategoriaAnexoTipo
}

function novoLocalId(indice: number): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.round(performance.now())}-${indice}`
}

/**
 * Gerencia a lista de anexos do turno: valida, sobe direto ao Storage (via
 * `enviarAnexo`) e expõe o estado de cada arquivo. Reutilizado no Assistente e
 * na página da consulta.
 */
export function useAnexosUpload(opts: OpcoesUpload = {}) {
  const { consultaId = null, categoria } = opts
  const [lista, setLista] = useState<AnexoUI[]>([])
  // Espelho do tamanho atual para impor o limite sem ler estado dentro do updater.
  const totalRef = useRef(0)
  useEffect(() => {
    totalRef.current = lista.length
  }, [lista])

  const atualizar = useCallback((localId: string, patch: Partial<AnexoUI>) => {
    setLista((l) => l.map((a) => (a.localId === localId ? { ...a, ...patch } : a)))
  }, [])

  const adicionar = useCallback(
    (arquivos: FileList | File[]) => {
      const espacoLivre = MAX_ANEXOS_POR_TURNO - totalRef.current
      if (espacoLivre <= 0) return
      const aceitos = Array.from(arquivos).slice(0, espacoLivre)
      totalRef.current += aceitos.length

      const novos: AnexoUI[] = []
      aceitos.forEach((file, i) => {
        const localId = novoLocalId(i)
        const erroVal = validarArquivo(file)
        if (erroVal) {
          novos.push({
            localId,
            nome: file.name,
            tipoMime: file.type,
            status: 'erro',
            erro: erroVal,
          })
          return
        }
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        novos.push({
          localId,
          nome: file.name,
          tipoMime: file.type,
          previewUrl,
          status: 'enviando',
        })

        // Side effect FORA do updater (handler roda uma vez, mesmo em StrictMode).
        enviarAnexo(file, { consultaId, categoria })
          .then((r) =>
            atualizar(localId, {
              status: 'pronto',
              anexoId: r.anexoId,
              nome: r.nome,
              tipoMime: r.tipoMime,
            }),
          )
          .catch((e: unknown) =>
            atualizar(localId, {
              status: 'erro',
              erro: e instanceof Error ? e.message : 'Falha no envio.',
            }),
          )
      })

      setLista((l) => [...l, ...novos])
    },
    [consultaId, categoria, atualizar],
  )

  const remover = useCallback((localId: string) => {
    setLista((l) => {
      const alvo = l.find((a) => a.localId === localId)
      if (alvo?.previewUrl) URL.revokeObjectURL(alvo.previewUrl)
      return l.filter((a) => a.localId !== localId)
    })
  }, [])

  const limpar = useCallback(() => {
    setLista((l) => {
      for (const a of l) if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      return []
    })
  }, [])

  const prontos = lista.filter((a) => a.status === 'pronto' && a.anexoId)
  const enviando = lista.some((a) => a.status === 'enviando')

  return { lista, adicionar, remover, limpar, prontos, enviando }
}
