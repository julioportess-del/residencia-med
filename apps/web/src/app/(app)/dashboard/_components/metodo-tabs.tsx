'use client'

import { useState } from 'react'
import type { inferRouterOutputs } from '@trpc/server'
import { Activity, FileText, Lightbulb, Repeat2, Stethoscope } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import type { AppRouter } from '@/server/routers/_app'

type DadosHoje = inferRouterOutputs<AppRouter>['dashboard']['hoje']
type TipoMetodo = keyof NonNullable<DadosHoje>['sessoesPorMetodo']

const METODOS: {
  id: TipoMetodo
  nome: string
  icone: typeof Stethoscope
  descricao: string
}[] = [
  {
    id: 'ANAMNESE',
    nome: 'Anamnese',
    icone: Stethoscope,
    descricao: 'Primeiro contato com conteúdo novo — compreensão teórica.',
  },
  {
    id: 'EXAME',
    nome: 'Exame',
    icone: Repeat2,
    descricao: 'Revisão espaçada ativa do que já foi estudado.',
  },
  {
    id: 'HIPOTESE',
    nome: 'Hipótese',
    icone: Lightbulb,
    descricao: 'Simulados de antecipação — testar o que você acha que vai cair.',
  },
  {
    id: 'CONDUTA',
    nome: 'Conduta',
    icone: Activity,
    descricao: 'Fechamento e consolidação final no pré-prova.',
  },
  {
    id: 'PRONTUARIO',
    nome: 'Prontuário',
    icone: FileText,
    descricao: 'Registro histórico de erros para consulta.',
  },
]

/**
 * Método clínico ativo nos últimos 30 dias.
 * Mostra quantas sessões de cada tipo o candidato fez, por aba.
 * Enquanto nenhuma sessão foi classificada, aparece explicação de como vai
 * funcionar (via escolha ao iniciar uma sessão — fluxo que entra na Onda 2).
 */
export function MetodoTabs({ dados }: { dados?: DadosHoje }) {
  const [ativa, setAtiva] = useState<TipoMetodo>('ANAMNESE')
  const contagens = dados?.sessoesPorMetodo
  const total = contagens ? Object.values(contagens).reduce((a, b) => a + b, 0) : 0
  const metodoAtivo = METODOS.find((m) => m.id === ativa)!

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between text-base">
          <span>Método ativo (últimos 30 dias)</span>
          <span className="text-xs font-normal text-muted-foreground">
            {total} {total === 1 ? 'sessão' : 'sessões'} classificada{total === 1 ? '' : 's'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          role="tablist"
          aria-label="Tipos de atividade metodológica"
          className="flex overflow-x-auto border-b"
        >
          {METODOS.map((m) => {
            const n = contagens?.[m.id] ?? 0
            const selecionado = m.id === ativa
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={selecionado}
                onClick={() => setAtiva(m.id)}
                className={cn(
                  '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                  selecionado
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <m.icone className="size-4" />
                <span>{m.nome}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                    selecionado ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {n}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-md bg-muted/40 p-3">
          <metodoAtivo.icone className="size-5 shrink-0 text-primary" />
          <div className="text-sm">
            <div className="font-semibold">{metodoAtivo.nome}</div>
            <div className="text-xs text-muted-foreground">{metodoAtivo.descricao}</div>
          </div>
        </div>
        {total === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Nenhuma sessão classificada ainda. A classificação por método passa a aparecer no fluxo
            de iniciar sessão na próxima onda.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
