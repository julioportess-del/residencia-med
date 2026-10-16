'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, Shuffle, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type Modo = 'PROVA' | 'ESTILO' | 'PERSONALIZADO'

/** Prova ACM/AMRIGS 2026: 100 questões em 4 h → 2,4 min por questão. */
const MINUTOS_POR_QUESTAO = 2.4
const QUESTOES_ESTILO_BANCA = 100

const MODOS: Array<{ v: Modo; titulo: string; descricao: string; icone: React.ReactNode }> = [
  {
    v: 'PROVA',
    titulo: 'Prova completa',
    descricao: 'Uma prova oficial (banca + ano), na ordem original, com tempo proporcional.',
    icone: <FileText className="size-5" />,
  },
  {
    v: 'ESTILO',
    titulo: 'Estilo banca',
    descricao: '100 questões inéditas para você, sorteadas das provas da banca.',
    icone: <Target className="size-5" />,
  },
  {
    v: 'PERSONALIZADO',
    titulo: 'Personalizado',
    descricao: 'Você escolhe banca, quantidade e tempo.',
    icone: <Shuffle className="size-5" />,
  },
]

export function SimuladoConfig() {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>('PROVA')
  const [bancaId, setBancaId] = useState('')
  const [ano, setAno] = useState<number | null>(null)
  const [nQuestoes, setNQuestoes] = useState(20)
  const [tempoMin, setTempoMin] = useState(48)

  const opcoes = trpc.questao.filtrosDisponiveis.useQuery()
  const banca = opcoes.data?.bancas.find((b) => b.id === bancaId)
  const totalAno = banca?.anos.find((a) => a.ano === ano)?.total ?? 0

  const criar = trpc.sessao.criar.useMutation({
    onSuccess: ({ sessaoId }) => router.push(`/simulado/${sessaoId}`),
    onError: (e) => toast.error(e.message ?? 'Erro ao criar simulado'),
  })

  const podeIniciar =
    modo === 'PROVA'
      ? Boolean(bancaId && ano)
      : modo === 'ESTILO'
        ? Boolean(bancaId)
        : nQuestoes > 0

  function submeter() {
    if (modo === 'PROVA' && bancaId && ano) {
      criar.mutate({
        tipo: 'SIMULADO',
        bancaId,
        filtros: { bancaIds: [bancaId], anos: [ano], situacao: 'TODAS' },
        numeroQuestoes: Math.min(totalAno, 120),
        tempoMinutos: Math.round(totalAno * MINUTOS_POR_QUESTAO),
        ordem: 'SEQUENCIAL',
      })
      return
    }
    if (modo === 'ESTILO' && bancaId) {
      criar.mutate({
        tipo: 'SIMULADO',
        bancaId,
        filtros: { bancaIds: [bancaId], situacao: 'INEDITAS' },
        numeroQuestoes: QUESTOES_ESTILO_BANCA,
        tempoMinutos: Math.round(QUESTOES_ESTILO_BANCA * MINUTOS_POR_QUESTAO),
        ordem: 'ALEATORIA',
      })
      return
    }
    criar.mutate({
      tipo: 'SIMULADO',
      bancaId: bancaId || undefined,
      filtros: { ...(bancaId ? { bancaIds: [bancaId] } : {}), situacao: 'TODAS' },
      numeroQuestoes: nQuestoes,
      tempoMinutos: tempoMin,
      ordem: 'ALEATORIA',
    })
  }

  return (
    <div className="mt-6 space-y-4">
      <div role="radiogroup" aria-label="Tipo de simulado" className="grid gap-2 sm:grid-cols-3">
        {MODOS.map((m) => (
          <button
            key={m.v}
            type="button"
            role="radio"
            aria-checked={modo === m.v}
            onClick={() => setModo(m.v)}
            className={cn(
              'flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-colors hover:border-primary/60',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              modo === m.v && 'border-primary bg-primary/5 ring-1 ring-primary',
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              {m.icone}
              {m.titulo}
            </span>
            <span className="text-xs text-muted-foreground">{m.descricao}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Banca{modo === 'PERSONALIZADO' ? ' (opcional)' : ''}</Label>
              <Select
                value={bancaId || 'todas'}
                onValueChange={(v) => {
                  setBancaId(v === 'todas' ? '' : v)
                  setAno(null)
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Escolha a banca" />
                </SelectTrigger>
                <SelectContent>
                  {modo === 'PERSONALIZADO' && <SelectItem value="todas">Todas</SelectItem>}
                  {opcoes.data?.bancas.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.codigo} — {b.total} questões
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {modo === 'PROVA' && (
              <div>
                <Label>Ano da prova</Label>
                <Select
                  value={ano ? String(ano) : ''}
                  onValueChange={(v) => setAno(Number(v))}
                  disabled={!banca}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={banca ? 'Escolha o ano' : 'Escolha a banca antes'} />
                  </SelectTrigger>
                  <SelectContent>
                    {banca?.anos.map((a) => (
                      <SelectItem key={a.ano} value={String(a.ano)}>
                        {a.ano} — {a.total} questões
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {modo === 'PROVA' && totalAno > 0 && (
            <p className="text-sm text-muted-foreground">
              {totalAno} questões · {Math.round(totalAno * MINUTOS_POR_QUESTAO)} min (ritmo da prova
              ACM/AMRIGS: 2,4 min por questão). Questões importadas do PDF oficial; o número pode
              diferir do caderno original se alguma não foi aproveitada.
            </p>
          )}

          {modo === 'PERSONALIZADO' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="n">Número de questões</Label>
                <Input
                  id="n"
                  type="number"
                  min={5}
                  max={120}
                  value={nQuestoes}
                  onChange={(e) => setNQuestoes(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="t">Tempo total (min)</Label>
                <Input
                  id="t"
                  type="number"
                  min={10}
                  max={360}
                  value={tempoMin}
                  onChange={(e) => setTempoMin(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <Button
            onClick={submeter}
            loading={criar.isPending}
            disabled={!podeIniciar}
            size="lg"
            className="w-full"
          >
            Iniciar simulado
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
