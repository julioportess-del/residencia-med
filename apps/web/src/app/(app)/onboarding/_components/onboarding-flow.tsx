'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addMonths, format } from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight, Clock, Target } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type Banca = {
  id: string
  codigo: string
  nome: string
  estado: string | null
  cor: string | null
}

const PASSOS = ['Bancas', 'Data da prova', 'Carga horária', 'Confirmar'] as const

export function OnboardingFlow({ bancas }: { bancas: Banca[] }) {
  const router = useRouter()
  const [passo, setPasso] = useState(0)
  const [bancaIds, setBancaIds] = useState<string[]>([])
  const [dataProva, setDataProva] = useState<string>(format(addMonths(new Date(), 6), 'yyyy-MM-dd'))
  const [cargaHoraria, setCargaHoraria] = useState<number>(20)

  const completar = trpc.onboarding.completar.useMutation({
    onSuccess: () => {
      toast.success('Plano sendo gerado. Vamos começar!')
      router.push('/dashboard')
      router.refresh()
    },
    onError: (e) => {
      toast.error(e.message ?? 'Erro ao salvar')
    },
  })

  const podeAvancar = () => {
    if (passo === 0) return bancaIds.length >= 1 && bancaIds.length <= 5
    if (passo === 1) return Boolean(dataProva) && new Date(dataProva) > new Date()
    if (passo === 2) return cargaHoraria >= 2 && cargaHoraria <= 80
    return true
  }

  const submeter = () => {
    completar.mutate({
      bancasAlvo: bancaIds,
      dataProva: new Date(dataProva),
      cargaHorariaSemanal: cargaHoraria,
      autoavaliacao: {},
    })
  }

  const progresso = ((passo + 1) / PASSOS.length) * 100

  return (
    <div className="container mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Passo {passo + 1} de {PASSOS.length}
        </p>
        <Progress value={progresso} className="mt-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{PASSOS[passo]}</CardTitle>
          <CardDescription>
            {passo === 0 &&
              'Selecione até 5 bancas que você quer estudar. A primeira será sua banca-alvo principal.'}
            {passo === 1 && 'Quando é a sua prova? Isso define o ritmo do plano de estudos.'}
            {passo === 2 && 'Quantas horas por semana você consegue dedicar?'}
            {passo === 3 && 'Confira os dados antes de gerar seu plano.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passo === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {bancas.map((b) => {
                const sel = bancaIds.includes(b.id)
                return (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() =>
                      setBancaIds((cur) =>
                        cur.includes(b.id)
                          ? cur.filter((id) => id !== b.id)
                          : cur.length < 5
                            ? [...cur, b.id]
                            : cur,
                      )
                    }
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3 text-left transition-all',
                      sel ? 'border-primary bg-primary/5' : 'hover:border-primary/50',
                    )}
                  >
                    <div>
                      <div className="font-medium">{b.nome}</div>
                      <div className="text-xs text-muted-foreground">{b.estado ?? 'Nacional'}</div>
                    </div>
                    {sel && (
                      <span
                        className="size-2 rounded-full"
                        style={{ background: b.cor ?? '#1d4ed8' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {passo === 1 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="data" className="flex items-center gap-2">
                  <Calendar className="size-4" /> Data da prova
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={dataProva}
                  onChange={(e) => setDataProva(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="mt-2"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Faltam aproximadamente{' '}
                <strong>
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(dataProva).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7),
                    ),
                  )}{' '}
                  semanas
                </strong>
                .
              </p>
            </div>
          )}

          {passo === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="horas" className="flex items-center gap-2">
                  <Clock className="size-4" /> Horas por semana
                </Label>
                <Input
                  id="horas"
                  type="number"
                  min={2}
                  max={80}
                  value={cargaHoraria}
                  onChange={(e) => setCargaHoraria(Number(e.target.value))}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 35].map((h) => (
                  <Button
                    key={h}
                    variant={cargaHoraria === h ? 'primary' : 'outline'}
                    size="sm"
                    type="button"
                    onClick={() => setCargaHoraria(h)}
                  >
                    {h}h
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {cargaHoraria < 10
                  ? 'Ritmo leve — bom para manter o hábito.'
                  : cargaHoraria < 25
                    ? 'Ritmo intermediário — equilíbrio entre estudo e vida.'
                    : 'Ritmo intenso — para a reta final ou dedicação integral.'}
              </p>
            </div>
          )}

          {passo === 3 && (
            <div className="space-y-3 text-sm">
              <ResumoLinha icone={<Target className="size-4" />} label="Bancas">
                {bancaIds
                  .map((id) => bancas.find((b) => b.id === id)?.codigo)
                  .filter(Boolean)
                  .join(', ')}
              </ResumoLinha>
              <ResumoLinha icone={<Calendar className="size-4" />} label="Data da prova">
                {format(new Date(dataProva), 'dd/MM/yyyy')}
              </ResumoLinha>
              <ResumoLinha icone={<Clock className="size-4" />} label="Carga horária">
                {cargaHoraria}h por semana
              </ResumoLinha>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setPasso((p) => p - 1)}
          disabled={passo === 0 || completar.isPending}
        >
          <ChevronLeft className="size-4" /> Voltar
        </Button>
        {passo < PASSOS.length - 1 ? (
          <Button onClick={() => setPasso((p) => p + 1)} disabled={!podeAvancar()}>
            Avançar <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={submeter} loading={completar.isPending}>
            Gerar plano
          </Button>
        )}
      </div>
    </div>
  )
}

function ResumoLinha({
  icone,
  label,
  children,
}: {
  icone: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icone}
        {label}
      </div>
      <div className="font-medium">{children}</div>
    </div>
  )
}
