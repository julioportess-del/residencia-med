'use client'

import type { inferRouterOutputs } from '@trpc/server'
import { Award, Compass, HeartPulse, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import type { AppRouter } from '@/server/routers/_app'

type DadosHoje = inferRouterOutputs<AppRouter>['dashboard']['hoje']
type Diagnostico = inferRouterOutputs<AppRouter>['dashboard']['diagnostico']

const CINTURAO_ATUAL = 'BRONZE' as const
const CINTUROES = [
  { id: 'BRONZE', nome: 'Bronze', cor: '#A97142' },
  { id: 'PRATA', nome: 'Prata', cor: '#B8B8B8' },
  { id: 'OURO', nome: 'Ouro', cor: '#C9A227' },
  { id: 'ESMERALDA', nome: 'Esmeralda', cor: '#2E8B57' },
  { id: 'PLATINA', nome: 'Platina', cor: '#8EA0B5' },
  { id: 'DIAMANTE', nome: 'Diamante', cor: '#6CA3C7' },
] as const

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

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Seu Perfil Clínico
        </h2>
        <span className="text-[11px] text-muted-foreground">
          Perfil completo chega na próxima atualização
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FaseJornadaCard fase={faseJornada} />
        <SimuladoDiagnosticoCard diagnostico={diagnostico} loading={loadingDiagnostico} />
        <PerfilDoCandidatoCard />
        <NivelCard />
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

function PerfilDoCandidatoCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <HeartPulse className="size-4" />
          Perfil do Candidato
        </div>
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
        <p className="mt-3 text-xs text-muted-foreground">
          Teste de perfil psicológico — chega na próxima onda.
        </p>
      </CardContent>
    </Card>
  )
}

function NivelCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Award className="size-4" />
          Seu Nível
        </div>
        <div className="mt-3 flex items-center justify-between gap-0.5">
          {CINTUROES.map((c) => {
            const ativo = c.id === CINTUROES_ATUAL_ID
            return (
              <div key={c.id} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    'size-5 rounded-full border-2 transition-all',
                    ativo ? 'border-primary' : 'border-muted',
                  )}
                  style={{ background: ativo ? c.cor : 'transparent' }}
                  title={c.nome}
                />
                <span
                  className={cn(
                    'text-[8px] font-medium uppercase tracking-wide',
                    ativo ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {c.nome.slice(0, 3)}
                </span>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Gamificação por cinturões — chega na próxima onda.
        </p>
      </CardContent>
    </Card>
  )
}

const CINTUROES_ATUAL_ID: (typeof CINTUROES)[number]['id'] = CINTURAO_ATUAL
