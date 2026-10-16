'use client'

import { useState } from 'react'
import { Layers } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'

type Props = {
  questaoId: string
  versoInicial: string
  origem?: 'ERRO' | 'IA' | 'MANUAL'
}

/** Transforma o conceito de um erro em cartão de repetição espaçada. */
export function CriarFlashcardInline({ questaoId, versoInicial, origem = 'ERRO' }: Props) {
  const utils = trpc.useUtils()
  const [aberto, setAberto] = useState(false)
  const [frente, setFrente] = useState('')
  const [verso, setVerso] = useState(versoInicial)

  const criar = trpc.flashcards.criar.useMutation({
    onSuccess: () => {
      toast.success('Flashcard criado no deck "Caderno de erros".')
      setAberto(false)
      setFrente('')
      void utils.flashcards.decks.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  if (!aberto) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          setVerso(versoInicial)
          setAberto(true)
        }}
      >
        <Layers className="size-3.5" /> Criar flashcard
      </Button>
    )
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <label className="block text-xs text-muted-foreground">
        Frente (pergunta que você quer saber responder)
        <input
          value={frente}
          onChange={(e) => setFrente(e.target.value)}
          maxLength={2000}
          autoFocus
          className="mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground"
          placeholder="Ex.: Na CAD, quando repor potássio antes da insulina?"
        />
      </label>
      <label className="block text-xs text-muted-foreground">
        Verso (resposta)
        <textarea
          value={verso}
          onChange={(e) => setVerso(e.target.value)}
          rows={2}
          maxLength={2000}
          className="mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground"
        />
      </label>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!frente.trim() || !verso.trim()}
          loading={criar.isPending}
          onClick={() => criar.mutate({ frente, verso, questaoId, origem })}
        >
          Salvar cartão
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
