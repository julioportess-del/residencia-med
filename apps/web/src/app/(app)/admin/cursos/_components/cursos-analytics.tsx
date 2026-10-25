'use client'

import { Clock, GraduationCap, Target, Users, Video } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export function CursosAnalytics() {
  const analytics = trpc.adminCursos.analytics.useQuery()
  const assistidas = trpc.adminCursos.aulasMaisAssistidas.useQuery({ limit: 10 })
  const concluidas = trpc.adminCursos.aulasMaisConcluidas.useQuery({ limit: 10 })

  if (analytics.isLoading) return <Skeleton className="mt-6 h-32" />
  if (!analytics.data) return null

  const { conteudo, consumo } = analytics.data
  const taxa = Math.round(consumo.taxaConclusao * 100)

  return (
    <section className="mt-6 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          icone={<GraduationCap className="size-4" />}
          label="Aulas publicadas"
          valor={`${conteudo.aulas}`}
          detalhe={`${conteudo.disciplinas} disciplinas · ${conteudo.grandesAreasPublicadas}/${conteudo.grandesAreas} áreas publicadas`}
        />
        <Kpi
          icone={<Video className="size-4" />}
          label="Vídeos cadastrados"
          valor={`${conteudo.videos}`}
        />
        <Kpi
          icone={<Users className="size-4" />}
          label="Alunos ativos"
          valor={`${consumo.alunosDistintos}`}
          detalhe="com progresso em ao menos 1 aula"
        />
        <Kpi
          icone={<Target className="size-4" />}
          label="Taxa de conclusão"
          valor={`${taxa}%`}
          detalhe={`${consumo.progressosConcluidos}/${consumo.progressosTotais} progressos`}
        />
        <Kpi
          icone={<Clock className="size-4" />}
          label="Horas assistidas"
          valor={`${consumo.horasAssistidas}h`}
          detalhe="somadas de todos os alunos"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aulas mais assistidas</CardTitle>
          </CardHeader>
          <CardContent>
            {assistidas.isLoading ? (
              <Skeleton className="h-48" />
            ) : !assistidas.data || assistidas.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ninguém começou nenhuma aula ainda.</p>
            ) : (
              <ol className="divide-y text-sm">
                {assistidas.data.map((a, i) => (
                  <li key={a.aulaId} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{a.titulo}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {a.grandeArea} · {a.disciplina}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      <div>{a.alunos} alunos</div>
                      {a.horasAssistidas > 0 && <div>{a.horasAssistidas}h</div>}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aulas mais concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            {concluidas.isLoading ? (
              <Skeleton className="h-48" />
            ) : !concluidas.data || concluidas.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma aula foi concluída ainda.</p>
            ) : (
              <ol className="divide-y text-sm">
                {concluidas.data.map((a, i) => (
                  <li key={a.aulaId} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{a.titulo}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {a.grandeArea} · {a.disciplina}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      <div>
                        {a.concluidos}/{a.iniciados}
                      </div>
                      <div>{Math.round(a.taxaConclusao * 100)}%</div>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function Kpi({
  icone,
  label,
  valor,
  detalhe,
}: {
  icone: React.ReactNode
  label: string
  valor: string
  detalhe?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icone}
          {label}
        </div>
        <div className="mt-2 text-3xl font-bold tabular-nums">{valor}</div>
        {detalhe && <div className="mt-1 text-xs text-muted-foreground">{detalhe}</div>}
      </CardContent>
    </Card>
  )
}
