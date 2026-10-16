'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Star, PauseCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type Nota = 'ERREI' | 'DIFICIL' | 'BOM' | 'FACIL'

const BOTOES: Array<{ nota: Nota; rotulo: string; tecla: string; cor: string }> = [
  {
    nota: 'ERREI',
    rotulo: 'Errei',
    tecla: '1',
    cor: 'border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40',
  },
  {
    nota: 'DIFICIL',
    rotulo: 'Difícil',
    tecla: '2',
    cor: 'border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40',
  },
  {
    nota: 'BOM',
    rotulo: 'Bom',
    tecla: '3',
    cor: 'border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
  },
  {
    nota: 'FACIL',
    rotulo: 'Fácil',
    tecla: '4',
    cor: 'border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40',
  },
]

/** Sessão de revisão: frente → (Espaço) verso → nota (1–4). */
export function SessaoRevisao({ deckId, onSair }: { deckId?: string; onSair: () => void }) {
  const utils = trpc.useUtils()
  const fila = trpc.flashcards.fila.useQuery(deckId ? { deckId } : {}, {
    refetchOnWindowFocus: false,
  })
  const [indice, setIndice] = useState(0)
  const [mostrando, setMostrando] = useState(false)
  const [feitos, setFeitos] = useState(0)

  const revisar = trpc.flashcards.revisar.useMutation({
    onError: (e) => toast.error(e.message),
  })
  const alternar = trpc.flashcards.alternar.useMutation({
    onSuccess: () => void utils.flashcards.fila.invalidate(),
  })

  const cartoes = fila.data?.cartoes ?? []
  const atual = cartoes[indice]

  const responder = useCallback(
    (nota: Nota) => {
      if (!atual || revisar.isPending) return
      revisar.mutate(
        { id: atual.id, nota },
        {
          onSuccess: () => {
            setFeitos((n) => n + 1)
            setMostrando(false)
            setIndice((i) => i + 1)
          },
        },
      )
    },
    [atual, revisar],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!mostrando && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setMostrando(true)
        return
      }
      if (mostrando) {
        const b = BOTOES.find((x) => x.tecla === e.key)
        if (b) responder(b.nota)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mostrando, responder])

  useEffect(() => {
    if (fila.data && indice >= cartoes.length) {
      void utils.flashcards.decks.invalidate()
      void utils.flashcards.estatisticas.invalidate()
    }
  }, [fila.data, indice, cartoes.length, utils])

  if (!fila.data) return <Skeleton className="h-72 w-full" />

  if (!atual) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border p-8 text-center">
        <CheckCircle2 className="size-10 text-emerald-500" />
        <div className="text-lg font-semibold">
          {feitos > 0 ? `Pronto! ${feitos} cartões revisados.` : 'Nenhum cartão vencido agora.'}
        </div>
        {fila.data.total > cartoes.length && (
          <Button
            onClick={() => {
              setIndice(0)
              void fila.refetch()
            }}
          >
            Carregar mais {fila.data.total - cartoes.length}
          </Button>
        )}
        <Button variant="outline" onClick={onSair}>
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {indice + 1} de {cartoes.length} · {atual.deck}
        </span>
        <button type="button" onClick={onSair} className="underline-offset-4 hover:underline">
          Encerrar
        </button>
      </div>
      <Progress value={(indice / cartoes.length) * 100} aria-label="Progresso da revisão" />

      <Card className="min-h-64">
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-end gap-1">
            <button
              type="button"
              aria-label={atual.favorito ? 'Remover dos favoritos' : 'Favoritar'}
              aria-pressed={atual.favorito}
              onClick={() => alternar.mutate({ id: atual.id, campo: 'favorito' })}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
            >
              <Star className={cn('size-4', atual.favorito && 'fill-amber-400 text-amber-400')} />
            </button>
            <button
              type="button"
              aria-label="Suspender cartão"
              title="Suspender (não aparece mais nas revisões)"
              onClick={() => {
                alternar.mutate({ id: atual.id, campo: 'suspenso' })
                setMostrando(false)
                setIndice((i) => i + 1)
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
            >
              <PauseCircle className="size-4" />
            </button>
          </div>
          <p className="whitespace-pre-line text-lg font-medium leading-relaxed">{atual.frente}</p>
          {mostrando && (
            <div className="border-t pt-4">
              <p className="whitespace-pre-line leading-relaxed">{atual.verso}</p>
              {atual.questaoId && (
                <Link
                  href={`/questoes/${atual.questaoId}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                >
                  <ExternalLink className="size-3" /> Questão de origem
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!mostrando ? (
        <Button size="lg" className="w-full" onClick={() => setMostrando(true)}>
          Mostrar resposta <kbd className="ml-2 rounded border px-1 text-xs opacity-70">Espaço</kbd>
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Como foi?">
          {BOTOES.map((b) => (
            <button
              key={b.nota}
              type="button"
              disabled={revisar.isPending}
              onClick={() => responder(b.nota)}
              className={cn(
                'flex flex-col items-center rounded-lg border-2 p-3 transition-colors disabled:opacity-50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                b.cor,
              )}
            >
              <span className="font-semibold">{b.rotulo}</span>
              <span className="text-xs text-muted-foreground">
                {atual.intervalos[b.nota]} · tecla {b.tecla}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
