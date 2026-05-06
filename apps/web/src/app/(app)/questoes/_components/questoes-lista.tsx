'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

const DIFICULDADES = [
  { v: 'FACIL', label: 'Fácil', cor: 'bg-emerald-100 text-emerald-700' },
  { v: 'MEDIO', label: 'Médio', cor: 'bg-amber-100 text-amber-700' },
  { v: 'DIFICIL', label: 'Difícil', cor: 'bg-rose-100 text-rose-700' },
  { v: 'MUITO_DIFICIL', label: 'Muito difícil', cor: 'bg-red-100 text-red-700' },
] as const

export function QuestoesLista() {
  const [bancaId, setBancaId] = useState<string | undefined>()
  const [dificuldade, setDificuldade] = useState<string | undefined>()

  const bancas = trpc.banca.listar.useQuery()
  const questoes = trpc.questao.listar.useQuery({
    bancaIds: bancaId ? [bancaId] : undefined,
    dificuldades: dificuldade ? ([dificuldade] as never) : undefined,
    limit: 30,
    somenteNaoRespondidas: false,
    somenteErradas: false,
  })

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={bancaId ?? 'todas'} onValueChange={(v) => setBancaId(v === 'todas' ? undefined : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Banca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as bancas</SelectItem>
            {bancas.data?.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.codigo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={dificuldade ?? 'todas'}
          onValueChange={(v) => setDificuldade(v === 'todas' ? undefined : v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as dificuldades</SelectItem>
            {DIFICULDADES.map((d) => (
              <SelectItem key={d.v} value={d.v}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(bancaId || dificuldade) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBancaId(undefined)
              setDificuldade(undefined)
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {questoes.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !questoes.data || questoes.data.itens.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          Nenhuma questão encontrada com esses filtros.
        </div>
      ) : (
        <div className="space-y-3">
          {questoes.data.itens.map((q) => {
            const dif = DIFICULDADES.find((d) => d.v === q.dificuldade)
            return (
              <Link key={q.id} href={`/questoes/${q.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge style={{ background: q.banca.cor ?? '#1d4ed8', color: 'white' }}>
                            {q.banca.codigo}
                          </Badge>
                          <span>{q.ano}</span>
                          {q.temaPrincipal && (
                            <>
                              <span>·</span>
                              <span>{q.temaPrincipal.nome}</span>
                            </>
                          )}
                          {q.jaRespondida && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-600">respondida</span>
                            </>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm">{q.resumo}…</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          dif?.cor,
                        )}
                      >
                        {dif?.label}
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
