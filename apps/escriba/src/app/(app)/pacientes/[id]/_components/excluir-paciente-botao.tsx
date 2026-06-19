'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { excluirPaciente } from '@/server/actions'

export function ExcluirPacienteBotao({ pacienteId }: { pacienteId: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  function excluir() {
    setErro(null)
    iniciar(async () => {
      const res = await excluirPaciente(pacienteId)
      if (!res.ok) {
        setErro(res.erro)
        return
      }
      router.replace('/pacientes')
      router.refresh()
    })
  }

  if (!confirmando) {
    return (
      <Button variant="outline" size="sm" onClick={() => setConfirmando(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmando(false)}
          disabled={pendente}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={excluir}
          loading={pendente}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Confirmar exclusão
        </Button>
      </div>
      {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
    </div>
  )
}
