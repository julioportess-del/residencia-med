'use client'

import type { inferRouterOutputs } from '@trpc/server'
import { Award, Compass, HeartPulse, Target } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc/client'
import type { AppRouter } from '@/server/routers/_app'

type DadosHoje = inferRouterOutputs<AppRouter>['dashboard']['hoje']
type Diagnostico = inferRouterOutputs<AppRouter>['dashboard']['diagnostico']
type NivelAtual = inferRouterOutputs<AppRouter>['nivel']['atual']
type PerfilAtual = inferRouterOutputs<AppRouter>['perfilCandidato']['atual']

const CINTUROES = [
  { id: 'BRONZE', nome: 'Bronze', cor: '#A97142' },
  { id: 'PRATA', nome: 'Prata', cor: '#B8B8B8' },
  { id: 'OURO', nome: 'Ouro', cor: '#C9A227' },
  { id: 'ESMERALDA', nome: 'Esmeralda', cor: '#2E8B57' },
  { id: 'PLATINA', nome: 'Platina', cor: '#8EA0B5' },
  { id: 'DIAMANTE', nome: 'Diamante', cor: '#6CA3C7' },
] as const

const DISC_LABELS: Record<string, string> = {
  ANALISTA: 'Analista',
  COMUNICADOR: 'Comunicador',
  EXECUTOR: 'Executor',
  CONCILIADOR: 'Conciliador',
}

export function PerfilClinicoCards({
  dados,
  diagnostico,
  loadingDiagnostico,
}: {
  dados?: DadosHoje
  diagnostico?: Diagnostico | null
  loadingDiagnostico: boolean
}) {
  const faseJornada = dados?.faseJornada ?? 'EXTENSIVO'
  const { data: nivel, isLoading: loadingNivel } = trpc.nivel.atual.useQuery()
  const { data: perfil, isLoading: loadingPerfil } = trpc.perfilCandidato.atual.useQuery()

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Seu Perfil Clínico
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FaseJornadaCard fase={faseJornada} />
        <SimuladoDiagnosticoCard diagnostico={diagnostico} loading={loadingDiagnostico} />
        <PerfilDoCandidatoCard perfil={perfil} loading={loadingPerfil} />
        <NivelCard nivel={nivel} loading={loadingNivel} />
      </div>
    </section>
  )
}

function FaseJornadaCard({ fase }: { fase: 'EXTENSIVO' | 'RETA_FINAL' }) {
  const isRetaFinal = fase === 'RETA_FINAL'
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <Compass className="size-4" />
          Fase da Jornada
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{isRetaFinal ? 'Reta Final' : 'Extensivo'}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {isRetaFinal
            ? 'Sprint pré-prova: foque em fechamento e revisão ativa.'
            : 'Construção de base ao longo do ano.'}
        </p>
      </CardContent>
    </Card>
  )
}

function SimuladoDiagnosticoCard({
  diagnostico,
  loading,
}: {
  diagnostico?: Diagnostico | null
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <Target className="size-4" />
          Simulado Diagnóstico
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-14" />
        ) : !diagnostico ? (
          <>
            <div className="mt-3 text-2xl font-bold text-muted-foreground">—</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Faça seu primeiro simulado para diagnosticar seu ponto de partida.
            </p>
          </>
        ) : (
          <>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {Math.round(diagnostico.taxaAcerto * 100)}%
              </span>
              <span className="text-sm text-muted-foreground">
                {diagnostico.acertos}/{diagnostico.total}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Primeiro simulado — seu ponto de partida.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PerfilDoCandidatoCard({
  perfil,
  loading,
}: {
  perfil?: PerfilAtual | null
  loading: boolean
}) {
  const concluido = perfil?.concluidoEm !== undefined && perfil?.concluidoEm !== null
  return (
    <Card className={cn(!concluido && 'border-dashed')}>
      <CardContent className="pt-6">
        <div
          className={cn(
            'flex items-center gap-2 text-xs font-medium uppercase tracking-wide',
            concluido ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <HeartPulse className="size-4" />
          Perfil do Candidato
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-16" />
        ) : concluido && perfil ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
              <Dim label="DISC" valor={perfil.disc ? (DISC_LABELS[perfil.disc] ?? null) : null} />
              <Dim label="Socioemo" valor={perfil.socioemocional ?? null} />
              <Dim label="Procrast." valor={perfil.procrastinacao ?? null} />
              <Dim label="Memória" valor={perfil.memoria ?? null} />
            </div>
            <Link
              href="/conta#perfil-candidato"
              className="mt-3 inline-block text-xs text-primary underline-offset-4 hover:underline"
            >
              Refazer teste →
            </Link>
          </>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
              {['Comportamento', 'Socioemocional', 'Procrastinação', 'Memória'].map((dim) => (
                <div
                  key={dim}
                  className="rounded border bg-background/50 px-2 py-1.5 text-center text-muted-foreground"
                >
                  {dim}
                </div>
              ))}
            </div>
            <Link
              href="/conta#perfil-candidato"
              className="mt-3 inline-block text-xs text-primary underline-offset-4 hover:underline"
            >
              Fazer teste rápido →
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Dim({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="rounded border bg-background/50 px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="truncate font-semibold">{valor ?? '—'}</div>
    </div>
  )
}

function NivelCard({ nivel, loading }: { nivel?: NivelAtual; loading: boolean }) {
  const atualId = nivel?.cinturao ?? 'BRONZE'
  const atualIdx = CINTUROES.findIndex((c) => c.id === atualId)
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <Award className="size-4" />
          Seu Nível
        </div>
        <div className="mt-3 flex items-center justify-between gap-0.5">
          {CINTUROES.map((c, i) => {
            const ativo = c.id === atualId
            const atingido = i <= atualIdx
            return (
              <div key={c.id} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    'size-5 rounded-full border-2 transition-all',
                    ativo ? 'border-primary' : atingido ? 'border-foreground/40' : 'border-muted',
                  )}
                  style={{
                    background: atingido ? c.cor : 'transparent',
                    opacity: atingido ? 1 : 0.5,
                  }}
                  title={c.nome}
                />
                <span
                  className={cn(
                    'text-[8px] font-medium uppercase tracking-wide',
                    ativo
                      ? 'text-primary'
                      : atingido
                        ? 'text-foreground/70'
                        : 'text-muted-foreground',
                  )}
                >
                  {c.nome.slice(0, 3)}
                </span>
              </div>
            )
          })}
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-4" />
        ) : nivel ? (
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${nivel.progressoPct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {nivel.xp.toLocaleString('pt-BR')} XP
              {nivel.xpProximaFaixa !== null && nivel.proximoCinturao
                ? ` · ${(nivel.xpProximaFaixa - nivel.xp).toLocaleString('pt-BR')} para ${nivel.proximoCinturao.toLowerCase()}`
                : ' · nível máximo'}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
