'use client'

import {
  Activity,
  Building2,
  DollarSign,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { precoFormatado } from '@residencia-med/billing/plans'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export function ExecDashboard() {
  const exec = trpc.admin.execResumo.useQuery()

  if (exec.isLoading) return <Skeleton className="mt-6 h-96" />
  if (!exec.data) return null

  const { usuarios, receita, planos, orgs, ia, atividade } = exec.data
  const crescimentoPositivo = usuarios.crescimentoPct >= 0

  const dadosPlanosB2C = Object.entries(planos.b2c).map(([nome, valor]) => ({
    nome,
    valor,
  }))
  const dadosPlanosB2B = Object.entries(planos.b2b).map(([nome, valor]) => ({
    nome,
    valor,
  }))

  return (
    <div className="mt-6 space-y-6">
      {/* KPIs principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icone={<DollarSign className="size-4" />}
          label="MRR total"
          valor={precoFormatado(receita.mrrTotalCentavos)}
          sub={`ARR ${precoFormatado(receita.arrCentavos)}`}
        />
        <Kpi
          icone={<Users className="size-4" />}
          label="Usuários"
          valor={usuarios.total.toLocaleString('pt-BR')}
          sub={`${usuarios.ativos30d.toLocaleString('pt-BR')} ativos 30d`}
        />
        <Kpi
          icone={crescimentoPositivo ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          label="Crescimento (30d vs 30-60d)"
          valor={`${crescimentoPositivo ? '+' : ''}${usuarios.crescimentoPct}%`}
          sub={`${usuarios.novos30d} novos nos últimos 30d`}
          destaque={crescimentoPositivo ? 'positivo' : 'negativo'}
        />
        <Kpi
          icone={<Zap className="size-4" />}
          label="Custo IA (mês)"
          valor={`$${ia.custoMesUsd.toFixed(2)}`}
          sub={`Hoje $${ia.custoHojeUsd.toFixed(2)}`}
        />
      </div>

      {/* Receita B2C vs B2B */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita por origem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Bloco
                rotulo="MRR B2C"
                valor={precoFormatado(receita.mrrB2CCentavos)}
                cor="bg-blue-500"
                pct={
                  receita.mrrTotalCentavos > 0
                    ? (receita.mrrB2CCentavos / receita.mrrTotalCentavos) * 100
                    : 0
                }
              />
              <Bloco
                rotulo="MRR B2B"
                valor={precoFormatado(receita.mrrB2BCentavos)}
                cor="bg-emerald-500"
                pct={
                  receita.mrrTotalCentavos > 0
                    ? (receita.mrrB2BCentavos / receita.mrrTotalCentavos) * 100
                    : 0
                }
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
              <DetalheLinha
                rotulo="Orgs ativas"
                valor={`${orgs.ativas} de ${orgs.total}`}
              />
              <DetalheLinha
                rotulo="Atividade no mês"
                valor={`${atividade.respostasMes.toLocaleString('pt-BR')} respostas`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de planos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">B2C</div>
              {dadosPlanosB2C.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem assinaturas B2C ativas.</p>
              ) : (
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={dadosPlanosB2C}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="nome" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">B2B</div>
              {dadosPlanosB2B.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem assinaturas B2B ativas.</p>
              ) : (
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={dadosPlanosB2B}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="nome" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top contas B2B */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4" />
            Top contas B2B por MRR
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgs.topMrr.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma assinatura B2B ativa.</p>
          ) : (
            <ul className="divide-y text-sm">
              {orgs.topMrr.map((o) => (
                <li key={o.orgId} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-semibold">{o.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.plano} · {o.seats} assentos
                    </div>
                  </div>
                  <div className="tabular-nums font-semibold">
                    {precoFormatado(o.mrrCentavos)}/mês
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Atividade e IA */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              Atividade da plataforma (mês)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <DetalheLinha
              rotulo="Respostas"
              valor={atividade.respostasMes.toLocaleString('pt-BR')}
            />
            <DetalheLinha
              rotulo="Simulados"
              valor={atividade.simuladosMes.toLocaleString('pt-BR')}
            />
            <DetalheLinha
              rotulo="Novos 7d"
              valor={usuarios.novos7d.toLocaleString('pt-BR')}
            />
            <DetalheLinha
              rotulo="Novos 30d"
              valor={usuarios.novos30d.toLocaleString('pt-BR')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              IA (mês corrente)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <DetalheLinha
              rotulo="Chamadas"
              valor={ia.chamadasMes.toLocaleString('pt-BR')}
            />
            <DetalheLinha
              rotulo="Custo"
              valor={`$${ia.custoMesUsd.toFixed(2)}`}
            />
            <DetalheLinha
              rotulo="Tokens entrada"
              valor={ia.inputTokensMes.toLocaleString('pt-BR')}
            />
            <DetalheLinha
              rotulo="Tokens saída"
              valor={ia.outputTokensMes.toLocaleString('pt-BR')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Kpi({
  icone,
  label,
  valor,
  sub,
  destaque,
}: {
  icone: React.ReactNode
  label: string
  valor: string | number
  sub?: string
  destaque?: 'positivo' | 'negativo'
}) {
  const corDestaque =
    destaque === 'positivo'
      ? 'text-emerald-600 dark:text-emerald-400'
      : destaque === 'negativo'
        ? 'text-rose-600 dark:text-rose-400'
        : ''
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icone}
          {label}
        </div>
        <div className={`mt-2 text-3xl font-bold tabular-nums ${corDestaque}`}>{valor}</div>
        {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  )
}

function Bloco({
  rotulo,
  valor,
  cor,
  pct,
}: {
  rotulo: string
  valor: string
  cor: string
  pct: number
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{rotulo}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{valor}</div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${cor}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{pct.toFixed(1)}% do MRR</div>
    </div>
  )
}

function DetalheLinha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{rotulo}</div>
      <div className="font-semibold tabular-nums">{valor}</div>
    </div>
  )
}
