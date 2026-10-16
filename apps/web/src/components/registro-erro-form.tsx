'use client'

import { useEffect, useState } from 'react'
import { NotebookPen } from 'lucide-react'
import { toast } from 'sonner'
import { ROTULO_MOTIVO_ERRO, type MotivoErro } from '@residencia-med/core'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

const MOTIVOS = Object.entries(ROTULO_MOTIVO_ERRO) as Array<[MotivoErro, string]>

type Props = {
  questaoId: string
  /** Ao salvar (ex.: atualizar a lista do caderno). */
  onSalvo?: () => void
  compacto?: boolean
}

/** Motivo do erro + conceito correto + anotação pessoal de uma questão. */
export function RegistroErroForm({ questaoId, onSalvo, compacto }: Props) {
  const utils = trpc.useUtils()
  const atual = trpc.caderno.obter.useQuery({ questaoId })
  const [motivo, setMotivo] = useState<MotivoErro | null>(null)
  const [conceito, setConceito] = useState('')
  const [anotacao, setAnotacao] = useState('')

  useEffect(() => {
    if (!atual.data) return
    setMotivo(atual.data.motivo)
    setConceito(atual.data.conceitoCorreto ?? '')
    setAnotacao(atual.data.anotacao ?? '')
  }, [atual.data])

  const salvar = trpc.caderno.registrar.useMutation({
    onSuccess: () => {
      toast.success('Salvo no caderno de erros.')
      void utils.caderno.obter.invalidate({ questaoId })
      void utils.caderno.listar.invalidate()
      onSalvo?.()
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className={cn('space-y-3', !compacto && 'rounded-lg border p-4')}>
      {!compacto && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <NotebookPen className="size-4" /> Caderno de erros
        </div>
      )}
      <fieldset>
        <legend className="mb-1.5 text-xs text-muted-foreground">Por que errei?</legend>
        <div className="flex flex-wrap gap-1.5">
          {MOTIVOS.map(([v, rotulo]) => (
            <button
              key={v}
              type="button"
              aria-pressed={motivo === v}
              onClick={() => setMotivo(motivo === v ? null : v)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                motivo === v
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:border-primary/60',
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block text-xs text-muted-foreground">
        Conceito correto (em uma frase)
        <textarea
          value={conceito}
          onChange={(e) => setConceito(e.target.value)}
          rows={2}
          maxLength={4000}
          className="mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground"
          placeholder="Ex.: Na cetoacidose, potássio < 3,3 → repor antes da insulina."
        />
      </label>
      <label className="block text-xs text-muted-foreground">
        Anotação pessoal
        <textarea
          value={anotacao}
          onChange={(e) => setAnotacao(e.target.value)}
          rows={2}
          maxLength={4000}
          className="mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground"
        />
      </label>
      <Button
        size="sm"
        onClick={() => salvar.mutate({ questaoId, motivo, conceitoCorreto: conceito, anotacao })}
        loading={salvar.isPending}
      >
        Salvar no caderno
      </Button>
    </div>
  )
}
