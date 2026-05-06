'use client'

import { Activity, DollarSign, Users, Zap } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { precoFormatado } from '@residencia-med/billing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

const CORES = ['#94a3b8', '#1d4ed8', '#f59e0b', '#10b981', '#ec4899']

export function AdminDashboard() {
  const resumo = trpc.admin.resumo.useQuery()
  const topIA = trpc.admin.usuariosTopIA.useQuery()

  if (resumo.isLoading) return <Skeleton className="mt-6 h-96" />
  if (!resumo.data) return null

  const { usuariosTotal, usuariosAtivos30d, mrrCentavos, distribuicaoPlanos, iaUltimos30d } =
    resumo.data

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icone={<Users className="size-4" />} label="Usuários" valor={usuariosTotal} />
        <Kpi
          icone={<Activity className="size-4" />}
          label="Ativos (30d)"
          valor={usuariosAtivos30d}
        />
        <Kpi
          icone={<DollarSign className="size-4" />}
          label="MRR"
          valor={precoFormatado(mrrCentavos)}
        />
        <Kpi
          icone={<Zap className="size-4" />}
          label="Custo IA (30d)"
          valor={`$${iaUltimos30d.custoUsd.toFixed(2)}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de planos (ativas)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={Object.entries(distribuicaoPlanos).map(([nome, value]) => ({ nome, value }))}
                  dataKey="value"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {Object.entries(distribuicaoPlanos).map((_, i) => (
                    <Cell key={i} fill={CORES[i % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 20 usuários por custo IA (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {topIA.isLoading ? (
              <Skeleton className="h-60" />
            ) : !topIA.data || topIA.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem chamadas IA registradas.</p>
            ) : (
              <ul className="divide-y text-sm">
                {topIA.data.map((u) => (
                  <li key={u.userId ?? '?'} className="flex items-center justify-between py-2">
                    <span className="truncate">{u.email}</span>
                    <span className="tabular-nums text-muted-foreground">
                      ${u.custoUsd.toFixed(3)} · {u.chamadas}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uso de IA (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <Detalhe label="Chamadas" valor={iaUltimos30d.chamadas.toLocaleString()} />
            <Detalhe label="Tokens entrada" valor={iaUltimos30d.inputTokens.toLocaleString()} />
            <Detalhe label="Tokens saída" valor={iaUltimos30d.outputTokens.toLocaleString()} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Kpi({
  icone,
  label,
  valor,
}: {
  icone: React.ReactNode
  label: string
  valor: string | number
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icone}
          {label}
        </div>
        <div className="mt-2 text-3xl font-bold tabular-nums">{valor}</div>
      </CardContent>
    </Card>
  )
}

function Detalhe({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{valor}</div>
    </div>
  )
}
