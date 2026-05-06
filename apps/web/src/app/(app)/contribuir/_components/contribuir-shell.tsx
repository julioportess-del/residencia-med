'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type Letra = 'A' | 'B' | 'C' | 'D' | 'E'
const LETRAS: Letra[] = ['A', 'B', 'C', 'D', 'E']

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  PENDENTE_IA: { label: 'Validando com IA', cor: 'bg-blue-100 text-blue-700' },
  REJEITADA_IA: { label: 'Reprovada na IA', cor: 'bg-rose-100 text-rose-700' },
  PENDENTE_REVISAO: { label: 'Aguardando revisão', cor: 'bg-amber-100 text-amber-700' },
  APROVADA: { label: 'Aprovada e publicada', cor: 'bg-emerald-100 text-emerald-700' },
  REJEITADA: { label: 'Rejeitada', cor: 'bg-rose-100 text-rose-700' },
}

export function ContribuirShell() {
  return (
    <div className="mt-6 space-y-6">
      <FormSubmissao />
      <MinhasSubmissoes />
    </div>
  )
}

function FormSubmissao() {
  const bancas = trpc.banca.listar.useQuery()
  const utils = trpc.useUtils()
  const submeter = trpc.contribuicao.submeter.useMutation({
    onSuccess: async () => {
      toast.success('Submissão enviada para validação')
      reset()
      await utils.contribuicao.minhas.invalidate()
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao submeter'),
  })

  const [bancaId, setBancaId] = useState<string>('')
  const [ano, setAno] = useState<number>(new Date().getFullYear())
  const [vignette, setVignette] = useState('')
  const [enunciado, setEnunciado] = useState('')
  const [alternativas, setAlternativas] = useState<Record<Letra, string>>({
    A: '', B: '', C: '', D: '', E: '',
  })
  const [gabarito, setGabarito] = useState<Letra>('A')
  const [fonteUrl, setFonteUrl] = useState('')

  const reset = () => {
    setBancaId('')
    setAno(new Date().getFullYear())
    setVignette('')
    setEnunciado('')
    setAlternativas({ A: '', B: '', C: '', D: '', E: '' })
    setGabarito('A')
    setFonteUrl('')
  }

  const submit = () => {
    if (!bancaId) return toast.error('Escolha a banca')
    if (enunciado.length < 20) return toast.error('Enunciado muito curto')
    if (Object.values(alternativas).some((t) => t.trim().length < 2)) {
      return toast.error('Preencha todas as 5 alternativas')
    }
    submeter.mutate({
      bancaId,
      ano,
      enunciado: enunciado.trim(),
      vignette: vignette.trim() || undefined,
      alternativas: LETRAS.map((l) => ({
        letra: l,
        texto: alternativas[l].trim(),
        correta: l === gabarito,
      })),
      gabaritoLetra: gabarito,
      fonteUrl: fonteUrl.trim() || undefined,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="size-4" />
          Nova submissão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label>Banca</Label>
            <Select value={bancaId} onValueChange={setBancaId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {bancas.data?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.codigo} — {b.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ano">Ano</Label>
            <Input
              id="ano"
              type="number"
              min={2000}
              max={new Date().getFullYear()}
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="vignette">Caso clínico (opcional)</Label>
          <textarea
            id="vignette"
            value={vignette}
            onChange={(e) => setVignette(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Mulher de 45 anos, hipertensa, comparece ao PS com..."
            maxLength={4000}
          />
        </div>

        <div>
          <Label htmlFor="enunciado">Pergunta</Label>
          <textarea
            id="enunciado"
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Qual a conduta inicial mais apropriada?"
            maxLength={4000}
          />
        </div>

        <div>
          <Label>Alternativas (marque o gabarito)</Label>
          <div className="mt-1 space-y-2">
            {LETRAS.map((l) => (
              <div key={l} className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => setGabarito(l)}
                  className={cn(
                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors',
                    gabarito === l
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                      : 'border-input hover:border-primary',
                  )}
                  title={gabarito === l ? 'Marcado como gabarito' : 'Marcar como gabarito'}
                >
                  {l}
                </button>
                <Input
                  value={alternativas[l]}
                  onChange={(e) => setAlternativas({ ...alternativas, [l]: e.target.value })}
                  placeholder={`Alternativa ${l}`}
                  maxLength={800}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="fonte">Fonte (URL da prova original — opcional)</Label>
          <Input
            id="fonte"
            type="url"
            value={fonteUrl}
            onChange={(e) => setFonteUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1"
          />
        </div>

        <Button onClick={submit} loading={submeter.isPending} size="lg" className="w-full">
          <Send className="size-4" />
          Enviar para validação
        </Button>
      </CardContent>
    </Card>
  )
}

function MinhasSubmissoes() {
  const lista = trpc.contribuicao.minhas.useQuery()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suas submissões</CardTitle>
      </CardHeader>
      <CardContent>
        {lista.isLoading ? (
          <Skeleton className="h-24" />
        ) : !lista.data || lista.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma submissão ainda. Submeta sua primeira acima.
          </p>
        ) : (
          <ul className="divide-y">
            {lista.data.map((s) => {
              const meta = STATUS_LABEL[s.status]
              return (
                <li key={s.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{s.banca.codigo}</Badge>
                        <span className="text-xs text-muted-foreground">{s.ano}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', meta?.cor)}>
                          {meta?.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm line-clamp-2">{s.enunciado}</p>
                      {s.scoreIA !== null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Score IA: {Math.round((s.scoreIA ?? 0) * 100)}/100 · {s.motivoIA?.slice(0, 200)}
                        </p>
                      )}
                      {s.motivoRejeicao && (
                        <p className="mt-1 text-xs text-rose-600">Motivo: {s.motivoRejeicao}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(s.createdAt, 'dd/MM HH:mm')}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
