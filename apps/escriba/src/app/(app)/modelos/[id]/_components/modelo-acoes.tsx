'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Play, Copy, Pencil, Trash2, Star } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Dialog } from '@/components/ui/dialog'
import { Alert } from '@/components/ui/alert'
import { duplicarModelo, excluirModelo, definirModeloPadrao } from '@/server/actions'

interface ModeloAcoesProps {
  modeloId: string
  isProprio: boolean
  isPadrao: boolean
}

export function ModeloAcoes({ modeloId, isProprio, isPadrao }: ModeloAcoesProps) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function duplicar() {
    iniciar(async () => {
      const res = await duplicarModelo(modeloId)
      if (res.ok) {
        router.push(`/modelos/${res.id}/editar`)
        router.refresh()
      } else setErro(res.erro)
    })
  }

  function definirPadrao() {
    setErro(null)
    iniciar(async () => {
      const res = await definirModeloPadrao(modeloId)
      if (res.ok) router.refresh()
      else setErro(res.erro)
    })
  }

  function excluir() {
    iniciar(async () => {
      const res = await excluirModelo(modeloId)
      if (res.ok) {
        router.replace('/modelos')
        router.refresh()
      } else setErro(res.erro)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/consultas/nova?modelo=${modeloId}`}>
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Usar este modelo
          </Button>
        </Link>
        <Button variant="outline" onClick={duplicar} disabled={pendente}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicar
        </Button>
        {isProprio ? (
          <>
            <Link href={`/modelos/${modeloId}/editar`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            {!isPadrao ? (
              <Button variant="outline" onClick={definirPadrao} disabled={pendente}>
                <Star className="mr-2 h-4 w-4" />
                Definir como padrão
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setConfirmarExcluir(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </>
        ) : null}
      </div>

      {erro ? <Alert variant="destructive">{erro}</Alert> : null}

      <Dialog
        aberto={confirmarExcluir}
        onFechar={() => setConfirmarExcluir(false)}
        titulo="Excluir modelo?"
        descricao="As consultas que já usaram este modelo não são afetadas."
        rodape={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmarExcluir(false)}
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
      />
    </div>
  )
}
