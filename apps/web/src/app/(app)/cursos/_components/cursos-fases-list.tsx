'use client'

import Link from 'next/link'
import { Flag, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc/client'

const FASES = [
  {
    id: 'EXTENSIVO' as const,
    nome: 'Extensivo',
    descricao: 'Construção de base ao longo do ano — cobertura ampla das grandes áreas.',
    icone: Flag,
  },
  {
    id: 'RETA_FINAL' as const,
    nome: 'Reta Final',
    descricao: 'Sprint pré-prova — fechamento, antecipação e lista de erros.',
    icone: Zap,
  },
]

export function CursosFasesList() {
  const { data, isLoading } = trpc.cursos.listarFases.useQuery()

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {isLoading
        ? [0, 1].map((i) => <Skeleton key={i} className="h-40" />)
        : FASES.map((fase) => {
            const disponivel = data?.find((f) => f.fase === fase.id)?.disponivel ?? false
            const inner = (
              <Card
                className={cn(
                  'transition-colors',
                  disponivel
                    ? 'hover:border-primary hover:bg-primary/5'
                    : 'border-dashed opacity-70',
                )}
              >
                <CardContent className="pt-6">
                  <div
                    className={cn(
                      'flex items-center gap-2 text-xs font-medium uppercase tracking-wide',
                      disponivel ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    <fase.icone className="size-4" />
                    {fase.nome}
                  </div>
                  <h2 className="mt-3 text-xl font-bold">{fase.nome}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{fase.descricao}</p>
                  <p className="mt-4 text-xs font-medium text-primary">
                    {disponivel ? 'Acessar aulas →' : 'Em breve'}
                  </p>
                </CardContent>
              </Card>
            )
            return disponivel ? (
              <Link key={fase.id} href={`/cursos/${fase.id.toLowerCase().replace('_', '-')}`}>
                {inner}
              </Link>
            ) : (
              <div key={fase.id}>{inner}</div>
            )
          })}
    </div>
  )
}
