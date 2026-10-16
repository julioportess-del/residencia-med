'use client'

import { useState } from 'react'
import { Layers, Plus, Repeat2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { SessaoRevisao } from './sessao-revisao'

const AMOSTRA_MINIMA_RETENCAO = 20

export function FlashcardsPainel() {
  const utils = trpc.useUtils()
  const decks = trpc.flashcards.decks.useQuery()
  const stats = trpc.flashcards.estatisticas.useQuery()
  const [revisando, setRevisando] = useState<{ deckId?: string } | null>(null)
  const [novoDeck, setNovoDeck] = useState('')
  const [frente, setFrente] = useState('')
  const [verso, setVerso] = useState('')
  const [deckDoCartao, setDeckDoCartao] = useState<string>('')

  const criarDeck = trpc.flashcards.criarDeck.useMutation({
    onSuccess: () => {
      setNovoDeck('')
      void utils.flashcards.decks.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
  const criar = trpc.flashcards.criar.useMutation({
    onSuccess: () => {
      toast.success('Cartão criado.')
      setFrente('')
      setVerso('')
      void utils.flashcards.decks.invalidate()
      void utils.flashcards.estatisticas.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  if (revisando) {
    return (
      <div className="mt-6">
        <SessaoRevisao deckId={revisando.deckId} onSair={() => setRevisando(null)} />
      </div>
    )
  }

  const totalVencidos = decks.data?.reduce((s, d) => s + d.vencidos, 0) ?? 0
  const retencao = stats.data?.retencao30d

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-primary/40 bg-primary/5 sm:col-span-1">
          <CardContent className="flex h-full flex-col justify-between gap-3 pt-6">
            <div>
              <div className="text-sm text-muted-foreground">Para revisar agora</div>
              <div className="text-4xl font-bold tabular-nums">
                {decks.data ? totalVencidos : '—'}
              </div>
            </div>
            <Button onClick={() => setRevisando({})} disabled={!totalVencidos}>
              <Repeat2 className="size-4" /> Revisar agora
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Revisões hoje</div>
            <div className="text-3xl font-semibold tabular-nums">
              {stats.data?.revisoesHoje ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.data?.totalCartoes ?? 0} cartões no total
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Retenção (30 dias)</div>
            <div className="text-3xl font-semibold tabular-nums">
              {retencao === null || retencao === undefined ? '—' : `${Math.round(retencao * 100)}%`}
            </div>
            <div className="text-xs text-muted-foreground">
              {(stats.data?.amostraRetencao ?? 0) < AMOSTRA_MINIMA_RETENCAO
                ? `Avaliação insuficiente (${stats.data?.amostraRetencao ?? 0} revisões)`
                : `${stats.data?.amostraRetencao} revisões de cartões maduros`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4" /> Decks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!decks.data ? (
            <Skeleton className="h-24" />
          ) : decks.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum deck ainda. Crie um cartão abaixo ou a partir do caderno de erros.
            </p>
          ) : (
            <ul className="divide-y">
              {decks.data.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.total} cartões · {d.novos} novos · {d.vencidos} vencidos
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={d.vencidos ? 'primary' : 'outline'}
                    disabled={!d.vencidos}
                    onClick={() => setRevisando({ deckId: d.id })}
                  >
                    Revisar
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (novoDeck.trim()) criarDeck.mutate({ nome: novoDeck.trim() })
            }}
          >
            <Input
              value={novoDeck}
              onChange={(e) => setNovoDeck(e.target.value)}
              placeholder="Novo deck (ex.: Anestesia — farmacologia)"
              aria-label="Nome do novo deck"
            />
            <Button type="submit" variant="outline" loading={criarDeck.isPending}>
              <Plus className="size-4" /> Criar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Novo cartão</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              criar.mutate({
                frente,
                verso,
                ...(deckDoCartao ? { deckId: deckDoCartao } : {}),
              })
            }}
          >
            <label className="block text-sm">
              Frente (pergunta)
              <textarea
                required
                value={frente}
                onChange={(e) => setFrente(e.target.value)}
                rows={2}
                maxLength={2000}
                className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              Verso (resposta)
              <textarea
                required
                value={verso}
                onChange={(e) => setVerso(e.target.value)}
                rows={3}
                maxLength={2000}
                className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deckDoCartao}
                onChange={(e) => setDeckDoCartao(e.target.value)}
                aria-label="Deck do cartão"
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Deck: Geral</option>
                {decks.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    Deck: {d.nome}
                  </option>
                ))}
              </select>
              <Button type="submit" loading={criar.isPending}>
                Adicionar cartão
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
