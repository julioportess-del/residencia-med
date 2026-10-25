'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc/client'

export function NovoTicketForm() {
  const router = useRouter()
  const criar = trpc.suporte.criar.useMutation({
    onSuccess: (t) => {
      toast.success('Ticket enviado.')
      router.push(`/suporte/${t.id}`)
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao enviar'),
  })

  const [titulo, setTitulo] = useState('')
  const [corpo, setCorpo] = useState('')
  const [categoria, setCategoria] = useState('')

  return (
    <form
      className="mt-6 space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        criar.mutate({ titulo, corpo, categoria })
      }}
    >
      <div>
        <Label htmlFor="titulo">Assunto</Label>
        <Input
          id="titulo"
          className="mt-1"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Um resumo curto"
          required
          minLength={3}
          maxLength={200}
        />
      </div>
      <div>
        <Label htmlFor="categoria">Categoria (opcional)</Label>
        <Input
          id="categoria"
          className="mt-1"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Ex: cobrança, bug, dúvida"
          maxLength={60}
        />
      </div>
      <div>
        <Label htmlFor="corpo">Descrição</Label>
        <textarea
          id="corpo"
          className="mt-1 min-h-[200px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          placeholder="O que aconteceu, quando, o que você esperava, como reproduzir."
          required
          minLength={10}
          maxLength={10_000}
        />
      </div>
      <Button type="submit" loading={criar.isPending}>
        Enviar ticket
      </Button>
    </form>
  )
}
