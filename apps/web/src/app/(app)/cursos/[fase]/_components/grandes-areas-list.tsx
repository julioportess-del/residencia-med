'use client'

import Link from 'next/link'
import { Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

const SLUG_FASE = { EXTENSIVO: 'extensivo', RETA_FINAL: 'reta-final' } as const

export function GrandesAreasList({ fase }: { fase: 'EXTENSIVO' | 'RETA_FINAL' }) {
  const { data, isLoading } = trpc.cursos.listarGrandesAreas.useQuery({ fase })

  if (isLoading) {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma Grande Área publicada ainda para esta fase.
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((area) => (
        <Link key={area.id} href={`/cursos/${SLUG_FASE[fase]}/${area.slug}`}>
          <Card
            className="h-full transition-colors hover:border-primary hover:bg-primary/5"
            style={area.corTema ? { borderLeftColor: area.corTema, borderLeftWidth: 4 } : undefined}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
                <Layers className="size-4" />
                Grande Área
              </div>
              <h2 className="mt-2 text-xl font-bold">{area.nome}</h2>
              {area.descricao && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{area.descricao}</p>
              )}
              <div className="mt-4 text-xs text-muted-foreground">
                {area.totalDisciplinas} {area.totalDisciplinas === 1 ? 'disciplina' : 'disciplinas'}
              </div>
              <p className="mt-2 text-xs font-medium text-primary">Acessar aulas →</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
