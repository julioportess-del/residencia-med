'use client'

import { Activity, Flame, ListChecks, Target } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export function DashboardClient() {
  const { data: resumo, isLoading: r1 } = trpc.dashboard.resumo.useQuery()
  const { data: porEsp, isLoading: r2 } = trpc.dashboard.porEspecialidade.useQuery()
  const { data: pf, isLoading: r3 } = trpc.dashboard.pontosFortesEFracos.useQuery()

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icone={<ListChecks className="size-4" />}
          label="Respostas"
          valor={resumo?.totalRespostas ?? '—'}
          loading={r1}
        />
        <KpiCard
          icone={<Target className="size-4" />}
          label="Taxa de acerto"
          valor={resumo ? `${Math.round(resumo.taxaAcerto * 100)}%` : '—'}
          loading={r1}
        />
        <KpiCard
          icone={<Activity className="size-4" />}
          label="Sessões (30 dias)"
          valor={resumo?.sessoes30d ?? '—'}
          loading={r1}
        />
        <KpiCard
          icone={<Flame className="size-4" />}
          label="Sequência"
          valor={resumo ? `${resumo.streak} ${resumo.streak === 1 ? 'dia' : 'dias'}` : '—'}
          loading={r1}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividade dos últimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          {r1 ? (
            <Skeleton className="h-64" />
          ) : !resumo || resumo.ultimos7.every((d) => d.total === 0) ? (
            <EstadoVazio>Nenhuma atividade nos últimos 7 dias.</EstadoVazio>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={resumo.ultimos7}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#94a3b8" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="acertos" fill="#10b981" name="Acertos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            {r2 ? (
              <Skeleton className="h-64" />
            ) : !porEsp || porEsp.length === 0 ? (
              <EstadoVazio>Responda algumas questões para ver seu desempenho por especialidade.</EstadoVazio>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={porEsp.map((e) => ({ name: e.nome, value: e.total }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {porEsp.map((e, i) => (
                      <Cell key={i} fill={e.cor ?? '#1d4ed8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pontos fortes e fracos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {r3 ? (
              <Skeleton className="h-40" />
            ) : !pf || (pf.fortes.length === 0 && pf.fracos.length === 0) ? (
              <EstadoVazio>Responda mais questões para revelar seus pontos fortes e fracos.</EstadoVazio>
            ) : (
              <>
                <Lista titulo="Mais fortes" itens={pf.fortes} variant="success" />
                <Lista titulo="Reforçar" itens={pf.fracos} variant="destructive" />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  icone,
  label,
  valor,
  loading,
}: {
  icone: React.ReactNode
  label: string
  valor: string | number
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icone}
          {label}
        </div>
        <div className="mt-2 text-3xl font-bold">
          {loading ? <Skeleton className="h-8 w-20" /> : valor}
        </div>
      </CardContent>
    </Card>
  )
}

function Lista({
  titulo,
  itens,
  variant,
}: {
  titulo: string
  itens: Array<{ id: string; nome: string; total: number; taxa: number }>
  variant: 'success' | 'destructive'
}) {
  if (itens.length === 0) return null
  return (
    <div>
      <div className="mb-2 text-sm font-medium">{titulo}</div>
      <ul className="space-y-1.5">
        {itens.map((t) => (
          <li key={t.id} className="flex items-center justify-between text-sm">
            <span className="truncate">{t.nome}</span>
            <Badge variant={variant}>{Math.round(t.taxa * 100)}%</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EstadoVazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {children}
    </div>
  )
}
