'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  questaoId: string
  alternativaEscolhida: string
  disabled?: boolean
}

export function ExplicarComIA({ questaoId, alternativaEscolhida, disabled }: Props) {
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [gerando, setGerando] = useState(false)

  const iniciar = async () => {
    setAberto(true)
    if (texto) return // já tem
    setGerando(true)
    setTexto('')
    try {
      const res = await fetch('/api/ai/explicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questaoId, alternativaEscolhida }),
      })
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setTexto((t) => t + decoder.decode(value, { stream: true }))
      }
    } catch (e) {
      toast.error('Falha ao gerar explicação com IA. Tente novamente.')
      void e
    } finally {
      setGerando(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={iniciar} disabled={disabled}>
        <Sparkles className="size-4" />
        Explicar mais com IA
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Explicação adicional
            </DialogTitle>
            <DialogDescription>
              Gerada por Claude com base no enunciado, alternativas e guidelines vinculados.
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none max-h-[60vh] overflow-y-auto whitespace-pre-line">
            {texto || (gerando ? 'Pensando...' : 'Aguarde')}
            {gerando && (
              <span className="ml-1 inline-block size-2 animate-pulse rounded-full bg-primary" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
