'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'

type Motivo = 'SPAM' | 'OFENSIVO' | 'FORA_DO_TEMA' | 'INFO_INCORRETA' | 'OUTRO'

const LABEL_MOTIVO: Record<Motivo, string> = {
  SPAM: 'Spam ou propaganda',
  OFENSIVO: 'Ofensivo ou discriminatório',
  FORA_DO_TEMA: 'Fora do tema (residência médica)',
  INFO_INCORRETA: 'Informação incorreta',
  OUTRO: 'Outro',
}

export function BotaoDenunciar({
  postId,
  comentarioId,
  variant = 'icon',
}: {
  postId?: string
  comentarioId?: string
  variant?: 'icon' | 'link'
}) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState<Motivo>('SPAM')
  const [detalhes, setDetalhes] = useState('')

  const reportar = trpc.comunidade.reportar.useMutation({
    onSuccess: (res) => {
      if (res.dedupe) {
        toast.info('Você já denunciou este conteúdo. Admin vai revisar.')
      } else {
        toast.success('Denúncia enviada. Admin vai revisar.')
      }
      setOpen(false)
      setDetalhes('')
    },
    onError: (e) => toast.error(e.message),
  })

  function submit() {
    reportar.mutate({
      postId,
      comentarioId,
      motivo,
      detalhes: detalhes || undefined,
    })
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          aria-label="Denunciar"
          title="Denunciar"
        >
          <Flag className="size-3" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
        >
          <Flag className="size-3" /> Denunciar
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar conteúdo</DialogTitle>
            <DialogDescription>
              Sua denúncia vai pra fila do admin. Nenhuma punição é automática.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Motivo</Label>
              <Select value={motivo} onValueChange={(v) => setMotivo(v as Motivo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LABEL_MOTIVO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Detalhes (opcional)</Label>
              <textarea
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                rows={3}
                maxLength={1000}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Contexto que ajude a avaliar a denúncia"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={reportar.isPending}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={reportar.isPending}>
              {reportar.isPending ? 'Enviando…' : 'Enviar denúncia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
