'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Dialog } from '@/components/ui/dialog'
import { Alert } from '@/components/ui/alert'
import { excluirPaciente } from '@/server/actions'

export function ExcluirPacienteBotao({ pacienteId }: { pacienteId: string }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
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

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>

      <Dialog
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo="Excluir paciente?"
        descricao="O cadastro será removido. As consultas vinculadas são mantidas, apenas desvinculadas."
        rodape={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAberto(false)}
              disabled={pendente}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={pendente}
              onClick={excluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </Button>
          </>
        }
      >
        {erro ? <Alert variant="destructive">{erro}</Alert> : null}
      </Dialog>
    </>
  )
}
