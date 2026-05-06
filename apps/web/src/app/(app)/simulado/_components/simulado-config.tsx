'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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

export function SimuladoConfig() {
  const router = useRouter()
  const [bancaId, setBancaId] = useState<string>('')
  const [nQuestoes, setNQuestoes] = useState(20)
  const [tempoMin, setTempoMin] = useState(40)

  const bancas = trpc.banca.listar.useQuery()
  const criar = trpc.sessao.criar.useMutation({
    onSuccess: ({ sessaoId }) => {
      router.push(`/simulado/${sessaoId}`)
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao criar simulado'),
  })

  const submeter = () => {
    criar.mutate({
      tipo: 'SIMULADO',
      bancaId: bancaId || undefined,
      filtros: bancaId ? { bancaIds: [bancaId] } : {},
      numeroQuestoes: nQuestoes,
      tempoMinutos: tempoMin,
    })
  }

  return (
    <Card className="mt-6">
      <CardContent className="pt-6 space-y-5">
        <div>
          <Label>Banca (opcional)</Label>
          <Select value={bancaId || 'todas'} onValueChange={(v) => setBancaId(v === 'todas' ? '' : v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {bancas.data?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.codigo} — {b.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <Button onClick={submeter} loading={criar.isPending} size="lg" className="w-full">
          Iniciar simulado
        </Button>
      </CardContent>
    </Card>
  )
}
