'use client'

import { useState } from 'react'
import { Lightbulb, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type Props = {
  questaoId: string
  disabled?: boolean
}

export function GerarSimilarDialog({ questaoId, disabled }: Props) {
  const [aberto, setAberto] = useState(false)
  const [revelado, setRevelado] = useState(false)

  const gerar = trpc.questao.gerarSimilar.useMutation({
    onError: (e) => toast.error(e.message ?? 'Falha ao gerar variação'),
  })

  const iniciar = () => {
    setAberto(true)
    setRevelado(false)
    if (!gerar.data && !gerar.isPending) {
      gerar.mutate({ questaoId })
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={iniciar} disabled={disabled}>
        <Sparkles className="size-4" />
        Gerar variação
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Questão parecida
            </DialogTitle>
            <DialogDescription>
              Gerada por IA no estilo da banca, sobre o mesmo tema. Use para treinar variações.
              Sempre confirme a correção com a literatura.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-4">
            {gerar.isPending ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : gerar.error ? (
              <p className="text-sm text-destructive">{gerar.error.message}</p>
            ) : gerar.data ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Dificuldade: {gerar.data.dificuldade.toLowerCase().replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">Gerada por IA</Badge>
                </div>

                {gerar.data.vignette && (
                  <div className="rounded-lg border bg-secondary/30 p-3 text-sm whitespace-pre-line">
                    {gerar.data.vignette}
                  </div>
                )}

                <p className="font-medium">{gerar.data.enunciado}</p>

                <ul className="space-y-2">
                  {gerar.data.alternativas.map((a) => {
                    const ehGabarito = a.letra === gerar.data?.gabaritoLetra
                    return (
                      <li
                        key={a.letra}
                        className={cn(
                          'rounded-lg border p-3 text-sm',
                          revelado && ehGabarito && 'border-emerald-500 bg-emerald-50',
                        )}
                      >
                        <span className="font-semibold mr-2">{a.letra})</span>
                        {a.texto}
                      </li>
                    )
                  })}
                </ul>

                {!revelado ? (
                  <Button variant="outline" className="w-full" onClick={() => setRevelado(true)}>
                    <Lightbulb className="size-4" />
                    Ver gabarito e explicação
                  </Button>
                ) : (
                  <div className="rounded-lg border bg-muted p-4 text-sm whitespace-pre-line">
                    {gerar.data.explicacaoMd}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRevelado(false)
                      gerar.reset()
                      gerar.mutate({ questaoId })
                    }}
                  >
                    Gerar outra
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
