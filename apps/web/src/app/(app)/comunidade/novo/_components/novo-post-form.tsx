'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc/client'

const CATEGORIAS = [
  { v: 'DISCUSSAO' as const, label: 'Discussão' },
  { v: 'DUVIDA' as const, label: 'Dúvida' },
  { v: 'DICA' as const, label: 'Dica' },
  { v: 'DESABAFO' as const, label: 'Desabafo' },
]

export function NovoPostForm() {
  const router = useRouter()
  const criar = trpc.comunidade.criar.useMutation({
    onSuccess: (p) => {
      toast.success('Post publicado.')
      router.push(`/comunidade/${p.id}`)
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao publicar'),
  })

  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]['v']>('DISCUSSAO')
  const [titulo, setTitulo] = useState('')
  const [corpo, setCorpo] = useState('')

  return (
    <form
      className="mt-6 space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        criar.mutate({ titulo, corpo, categoria })
      }}
    >
      <div>
        <Label>Categoria</Label>
        <div className="mt-2 flex gap-1.5 overflow-x-auto">
          {CATEGORIAS.map((c) => (
            <button
              key={c.v}
              type="button"
              onClick={() => setCategoria(c.v)}
              className={
                'whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ' +
                (c.v === categoria
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground')
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          className="mt-1"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="O que você quer dizer?"
          required
          minLength={3}
          maxLength={200}
        />
      </div>
      <div>
        <Label htmlFor="corpo">Mensagem</Label>
        <textarea
          id="corpo"
          className="mt-1 min-h-[200px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          placeholder="Dê detalhes. A comunidade pode comentar seu post."
          required
          minLength={10}
          maxLength={10_000}
        />
      </div>
      <Button type="submit" loading={criar.isPending}>
        Publicar
      </Button>
    </form>
  )
}
