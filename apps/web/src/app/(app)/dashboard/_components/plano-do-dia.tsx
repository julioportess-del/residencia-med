'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, Repeat2, Sparkles, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  MINUTOS_POR_MODO,
  planejarDia,
  saudacao,
  type ModoEstudo,
  type TipoTarefa,
} from '@residencia-med/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type Props = {
  nome: string
  revisoesPendentes: number
  errosAbertos: number
  ineditasBancaAlvo: number
  filtrosIneditas: { situacao: 'INEDITAS'; bancaIds?: string[] }
  bancaAlvo: string | null
}

const MODOS: Array<{ v: ModoEstudo; label: string }> = [
  { v: 'RAPIDO', label: 'Rápido · 10 min' },
  { v: 'PADRAO', label: 'Padrão · 40 min' },
  { v: 'APROFUNDADO', label: 'Aprofundado · 90 min' },
]

const CHAVE_MODO = 'painel:modo-estudo'

const ICONE: Record<TipoTarefa, React.ReactNode> = {
  REVISOES: <Repeat2 className="size-4" />,
  ERROS: <XCircle className="size-4" />,
  INEDITAS: <Sparkles className="size-4" />,
}

function lerModo(): ModoEstudo {
  try {
    const v = window.localStorage.getItem(CHAVE_MODO)
    return v === 'RAPIDO' || v === 'PADRAO' || v === 'APROFUNDADO' ? v : 'PADRAO'
  } catch {
    return 'PADRAO'
  }
}

export function PlanoDoDia(props: Props) {
  const router = useRouter()
  const [modo, setModo] = useState<ModoEstudo>('PADRAO')
  const [agora] = useState(() => new Date())

  useEffect(() => setModo(lerModo()), [])

  function escolher(m: ModoEstudo) {
    setModo(m)
    try {
      window.localStorage.setItem(CHAVE_MODO, m)
    } catch {
      // sem armazenamento: só não lembra a escolha
    }
  }

  const minutos = MINUTOS_POR_MODO[modo]
  const { tarefas } = planejarDia({
    minutos,
    revisoesPendentes: props.revisoesPendentes,
    errosAbertos: props.errosAbertos,
    ineditasDisponiveis: props.ineditasBancaAlvo,
  })

  const criar = trpc.sessao.criar.useMutation({
    onSuccess: ({ sessaoId }) => router.push(`/estudo/${sessaoId}`),
    onError: (e) => toast.error(e.message),
  })

  function comecar(tipo: TipoTarefa, quantidade: number) {
    const filtros =
      tipo === 'REVISOES'
        ? { situacao: 'REVISAO_VENCIDA' as const }
        : tipo === 'ERROS'
          ? { situacao: 'ERRADAS' as const }
          : props.filtrosIneditas
    criar.mutate({ tipo: 'ESTUDO', filtros, numeroQuestoes: quantidade, ordem: 'ALEATORIA' })
  }

  const textoTarefa: Record<TipoTarefa, (n: number) => string> = {
    REVISOES: (n) => `${n} ${n === 1 ? 'revisão vencida' : 'revisões vencidas'}`,
    ERROS: (n) => `Refazer ${n} ${n === 1 ? 'erro' : 'erros'} do caderno`,
    INEDITAS: (n) =>
      `${n} ${n === 1 ? 'questão inédita' : 'questões inéditas'}${props.bancaAlvo ? ` da ${props.bancaAlvo}` : ''}`,
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {saudacao(agora)}, {props.nome.split(' ')[0]}!
            </h2>
            <p className="text-sm text-muted-foreground">
              Quanto tempo você tem hoje? O plano se ajusta.
            </p>
          </div>
          <div role="radiogroup" aria-label="Tempo disponível" className="flex flex-wrap gap-1.5">
            {MODOS.map((m) => (
              <button
                key={m.v}
                type="button"
                role="radio"
                aria-checked={modo === m.v}
                onClick={() => escolher(m.v)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  modo === m.v
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:border-primary/60',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {tarefas.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Nada pendente e nenhuma questão inédita disponível com seus filtros. Ajuste as
            bancas-alvo no onboarding ou explore o banco de questões.
          </p>
        ) : (
          <ol className="space-y-2">
            {tarefas.map((t, i) => (
              <li key={t.tipo} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {ICONE[t.tipo]}
                    {textoTarefa[t.tipo](t.quantidade)}
                  </div>
                  <div className="text-xs text-muted-foreground">~{t.minutos} min</div>
                </div>
                <Button
                  size="sm"
                  variant={i === 0 ? 'primary' : 'outline'}
                  onClick={() => comecar(t.tipo, t.quantidade)}
                  disabled={criar.isPending}
                >
                  Começar <ArrowRight className="size-3.5" />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
