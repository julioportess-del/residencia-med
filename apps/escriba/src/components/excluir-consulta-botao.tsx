'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { excluirConsulta } from '@/server/actions'

interface ExcluirConsultaBotaoProps {
  consultaId: string
  rotulo: string
}

/**
 * Botão de excluir consulta com confirmação inline (sem dialog nativo).
 * Soft-delete via server action; a lista é revalidada no servidor.
 */
export function ExcluirConsultaBotao({ consultaId, rotulo }: ExcluirConsultaBotaoProps) {
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [excluindo, iniciarExcluir] = useTransition()

  function excluir() {
    setErro(null)
    iniciarExcluir(async () => {
      const res = await excluirConsulta(consultaId)
      if (!res.ok) {
        setErro(res.erro)
        setConfirmando(false)
      }
      // Em caso de sucesso, a revalidação remove o item da lista.
    })
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        {erro ? <span className="sr-only">{erro}</span> : null}
        <button
          type="button"
          onClick={excluir}
          disabled={excluindo}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-destructive px-2.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
        >
          {excluindo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Excluir
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={excluindo}
          className="inline-flex h-8 items-center rounded-md border border-input px-2.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      aria-label={`Excluir consulta de ${rotulo}`}
      title="Excluir consulta"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
