'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronRight, PlayCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc/client'

const SLUG_FASE = { EXTENSIVO: 'extensivo', RETA_FINAL: 'reta-final' } as const

export function AreaDetalhe({
  fase,
  areaSlug,
}: {
  fase: 'EXTENSIVO' | 'RETA_FINAL'
  areaSlug: string
}) {
  const { data, isLoading } = trpc.cursos.obterGrandeArea.useQuery({ fase, areaSlug })

  if (isLoading) return <Skeleton className="mt-6 h-96" />
  if (!data) return null

  return (
    <>
      <h1 className="mt-2 text-3xl font-bold">{data.nome}</h1>
      {data.descricao && <p className="mt-2 text-muted-foreground">{data.descricao}</p>}

      <div className="mt-6 space-y-3">
        {data.disciplinas.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma disciplina publicada ainda.
          </div>
        ) : (
          data.disciplinas.map((d) => (
            <DisciplinaAccordion
              key={d.id}
              fase={fase}
              areaSlug={areaSlug}
              disciplina={d}
              corArea={data.corTema}
            />
          ))
        )}
      </div>
    </>
  )
}

function DisciplinaAccordion({
  fase,
  areaSlug,
  disciplina,
  corArea,
}: {
  fase: 'EXTENSIVO' | 'RETA_FINAL'
  areaSlug: string
  disciplina: {
    id: string
    slug: string
    nome: string
    codigo: string | null
    _count: { aulas: number }
    aulasConcluidas: number
  }
  corArea: string | null
}) {
  const [aberta, setAberta] = useState(false)
  const detalhe = trpc.cursos.obterDisciplina.useQuery(
    { fase, areaSlug, disciplinaSlug: disciplina.slug },
    { enabled: aberta },
  )

  const totalAulas = disciplina._count.aulas
  const concluidas = disciplina.aulasConcluidas
  const pct = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0
  const todasConcluidas = totalAulas > 0 && concluidas === totalAulas

  return (
    <Card>
      <CardHeader
        role="button"
        onClick={() => setAberta((v) => !v)}
        className="cursor-pointer select-none"
      >
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="flex min-w-0 items-center gap-2">
            {aberta ? (
              <ChevronDown className="size-4 shrink-0" />
            ) : (
              <ChevronRight className="size-4 shrink-0" />
            )}
            {disciplina.codigo && (
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  background: corArea ? `${corArea}20` : 'hsl(var(--muted))',
                  color: corArea ?? 'hsl(var(--muted-foreground))',
                }}
              >
                {disciplina.codigo}
              </span>
            )}
            <span className="truncate">{disciplina.nome}</span>
          </span>
          <span className="flex shrink-0 items-center gap-3 text-xs font-normal text-muted-foreground">
            {totalAulas > 0 && (
              <span
                className={cn('tabular-nums', todasConcluidas && 'font-semibold text-emerald-600')}
              >
                {concluidas}/{totalAulas}
              </span>
            )}
            <span>{totalAulas === 1 ? 'aula' : 'aulas'}</span>
          </span>
        </CardTitle>
        {totalAulas > 0 && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all',
                todasConcluidas ? 'bg-emerald-600' : 'bg-primary',
              )}
              style={{ width: `${pct}%` }}
              aria-label={`${pct}% das aulas concluídas`}
            />
          </div>
        )}
      </CardHeader>
      {aberta && (
        <CardContent>
          {detalhe.isLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <ul className="divide-y">
              {detalhe.data?.aulas.map((a) => {
                const concluida = a.progresso.some((p) => p.concluida)
                const videos = a.videos
                const totalBase = videos.filter((v) => v.tipo === 'BASE').length
                const totalApro = videos.filter((v) => v.tipo === 'APROFUNDADA').length
                const minutos = Math.round(videos.reduce((s, v) => s + v.duracaoS, 0) / 60)
                return (
                  <li key={a.id}>
                    <Link
                      href={`/cursos/${SLUG_FASE[fase]}/${areaSlug}/${disciplina.slug}/${a.slug}`}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-accent/40"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {concluida ? (
                          <Check className="size-4 shrink-0 text-emerald-600" />
                        ) : (
                          <PlayCircle className="size-4 shrink-0 text-primary" />
                        )}
                        <span className={cn('truncate', concluida && 'text-muted-foreground')}>
                          {a.titulo}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {totalBase > 0 && <span className="mr-2">{totalBase}B</span>}
                        {totalApro > 0 && <span className="mr-2">{totalApro}A</span>}
                        {minutos > 0 && <span>{minutos}min</span>}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  )
}
