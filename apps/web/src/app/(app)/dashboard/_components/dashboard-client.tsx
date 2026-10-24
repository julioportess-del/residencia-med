'use client'

import { Activity, Flame, Gauge, ListChecks, Target, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { PainelHoje } from './painel-hoje'
import { PrioridadesCard } from './prioridades-card'

export function DashboardClient() {
  const { data: resumo, isLoading: r1 } = trpc.dashboard.resumo.useQuery()
  const { data: hoje, isLoading: r0 } = trpc.dashboard.hoje.useQuery()
  const { data: prioridades, isLoading: r2 } = trpc.dashboard.prioridades.useQuery()
  const { data: pf, isLoading: r3 } = trpc.dashboard.pontosFortesEFracos.useQuery()
  const { data: pares, isLoading: r4 } = trpc.dashboard.comparacaoPares.useQuery()
  const { data: profic, isLoading: r5 } = trpc.proficiencia.atual.useQuery()

  return (
    <div className="mt-6 space-y-6">
      <PainelHoje dados={hoje} loading={r0} />

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
          <CardTitle className="flex items-center gap-2">
            <Gauge className="size-4" />
            Estimativa de proficiência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Proficiencia dados={profic} loading={r5} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <PrioridadesCard dados={prioridades} loading={r2} />

        <Card>
          <CardHeader>
            <CardTitle>Pontos fortes e fracos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {r3 ? (
              <Skeleton className="h-40" />
            ) : !pf || (pf.fortes.length === 0 && pf.fracos.length === 0) ? (
              <EstadoVazio>
                Responda mais questões para revelar seus pontos fortes e fracos.
              </EstadoVazio>
            ) : (
              <>
                <Lista titulo="Mais fortes" itens={pf.fortes} variant="success" />
                <Lista titulo="Reforçar" itens={pf.fracos} variant="destructive" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Como você está vs outros candidatos da sua banca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ComparacaoPares dados={pares as DadosPares | null | undefined} loading={r4} />
        </CardContent>
      </Card>
    </div>
  )
}

type DadosPares = {
  bancaAlvo: string
  totalPares: number
  minhaTaxa: number | null
  mediaPares: number | null
  percentil: number | null
  quartis: { p10: number; p25: number; p50: number; p75: number; p90: number } | null
}

function ComparacaoPares({
  dados,
  loading,
}: {
  dados: DadosPares | null | undefined
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-32" />
  if (!dados) {
    return (
      <EstadoVazio>
        Defina sua banca-alvo no onboarding para comparar com outros candidatos.
      </EstadoVazio>
    )
  }
  const d = dados
  if (d.totalPares < 5) {
    return (
      <EstadoVazio>
        Ainda não há candidatos suficientes da {d.bancaAlvo} para uma comparação anônima (precisamos
        de pelo menos 5).
      </EstadoVazio>
    )
  }
  if (d.minhaTaxa === null || d.percentil === null || d.mediaPares === null || d.quartis === null) {
    return (
      <EstadoVazio>
        Responda pelo menos 10 questões para se comparar aos {d.totalPares} colegas da {d.bancaAlvo}
        .
      </EstadoVazio>
    )
  }

  const minhaPct = Math.round(d.minhaTaxa * 100)
  const mediaPct = Math.round(d.mediaPares * 100)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Sua taxa" valor={`${minhaPct}%`} destaque />
        <Stat label={`Média ${d.bancaAlvo}`} valor={`${mediaPct}%`} />
        <Stat label="Seu percentil" valor={`p${d.percentil}`} />
      </div>
      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">
          Distribuição entre {d.totalPares} candidatos com mesma banca-alvo
        </div>
        <div className="relative h-2 w-full rounded-full bg-secondary">
          <div
            className="absolute top-0 h-2 rounded-full bg-primary/30"
            style={{
              left: `${d.quartis.p25 * 100}%`,
              width: `${(d.quartis.p75 - d.quartis.p25) * 100}%`,
            }}
          />
          <div
            className="absolute top-0 h-2 w-0.5 bg-foreground"
            style={{ left: `${d.quartis.p50 * 100}%` }}
            title="Mediana"
          />
          <div
            className="absolute -top-1 size-4 rounded-full border-2 border-primary bg-background"
            style={{ left: `calc(${minhaPct}% - 8px)` }}
            title="Você"
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Comparação anônima — apenas distribuição agregada da sua banca, sem identificar ninguém.
      </p>
    </div>
  )
}

function Stat({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div
      className={
        destaque ? 'rounded-lg border-2 border-primary bg-primary/5 p-3' : 'rounded-lg border p-3'
      }
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{valor}</div>
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

type DadosProficiencia = {
  scoreGlobal: number
  totalRespostas: number
  porEspecialidade: Array<{
    especialidadeId: string
    nome: string
    score: number
    total: number
    acertos: number
    pesoTotal: number
  }>
}

function Proficiencia({
  dados,
  loading,
}: {
  dados: DadosProficiencia | null | undefined
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-32" />
  if (!dados || dados.totalRespostas < 10) {
    return (
      <EstadoVazio>
        Responda pelo menos 10 questões para gerarmos sua estimativa de proficiência.
      </EstadoVazio>
    )
  }

  const score = Math.round(dados.scoreGlobal)
  const cor =
    score >= 75 ? '#10b981' : score >= 55 ? '#AB5D21' : score >= 35 ? '#f59e0b' : '#dc2626'
  const interpretacao =
    score >= 75
      ? 'Você está num nível avançado. Mantenha o ritmo e foque em pontos fracos específicos.'
      : score >= 55
        ? 'Bom preparo. Continue distribuindo o estudo nas especialidades em vermelho abaixo.'
        : score >= 35
          ? 'Em construção. Concentre nas especialidades com peso maior — onde você mais pratica.'
          : 'Início do percurso. Cada questão respondida calibra esse score.'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <Medidor score={score} cor={cor} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-muted-foreground">Score global</div>
          <div className="text-3xl font-bold tabular-nums" style={{ color: cor }}>
            {score}/100
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{interpretacao}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Cálculo ponderado por dificuldade — questões difíceis valem mais.
          </p>
        </div>
      </div>

      {dados.porEspecialidade.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
            Por especialidade
          </div>
          <ul className="space-y-1.5">
            {dados.porEspecialidade.slice(0, 8).map((e) => (
              <li key={e.especialidadeId}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">{e.nome}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {Math.round(e.score)}/100 · {e.acertos}/{e.total}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${e.score}%`,
                      background:
                        e.score >= 75
                          ? '#10b981'
                          : e.score >= 55
                            ? '#AB5D21'
                            : e.score >= 35
                              ? '#f59e0b'
                              : '#dc2626',
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Medidor({ score, cor }: { score: number; cor: string }) {
  // SVG circular gauge
  const raio = 36
  const circ = 2 * Math.PI * raio
  const offset = circ - (score / 100) * circ
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={raio} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
      <circle
        cx="48"
        cy="48"
        r={raio}
        fill="none"
        stroke={cor}
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="48"
        y="54"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill={cor}
        fontFamily="system-ui"
      >
        {score}
      </text>
    </svg>
  )
}
