'use client'

import Link from 'next/link'
import { ChevronRight, Repeat2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export function RevisaoLista() {
  const itens = trpc.revisao.itensVencidos.useQuery()
  const contagem = trpc.revisao.contagem.useQuery()

  if (itens.isLoading) {
    return (
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (!itens.data || itens.data.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Repeat2 className="size-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>Nenhum item de revisão vencido.</p>
          {contagem.data && contagem.data.total > 0 ? (
            <p className="text-xs mt-1">
              Você tem {contagem.data.total} itens em revisão espaçada — próximos vão aparecer aqui
              no dia.
            </p>
          ) : (
            <p className="text-xs mt-1">Responda algumas questões para alimentar a revisão.</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="text-sm text-muted-foreground">
        {itens.data.length} {itens.data.length === 1 ? 'item' : 'itens'} para revisar hoje
      </div>
      {itens.data.map((i) => (
        <Link key={i.id} href={`/questoes/${i.questaoId}`}>
          <Card className="transition-colors hover:border-primary">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge style={{ background: i.questao.banca.cor ?? '#1d4ed8', color: 'white' }}>
                      {i.questao.banca.codigo}
                    </Badge>
                    <span>{i.questao.ano}</span>
                    {i.questao.tema && (
                      <>
                        <span>·</span>
                        <span>{i.questao.tema.nome}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>repetição {i.repeticoes}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">{i.questao.resumo}…</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
