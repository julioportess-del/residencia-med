'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

const PLANOS = [
  {
    codigo: 'STARTER' as const,
    nome: 'Starter',
    seats: 10,
    preco: 'R$ 99/mês',
    benefits: ['Até 10 alunos', 'Plano Pro para todos', 'Painel agregado'],
  },
  {
    codigo: 'GROWTH' as const,
    nome: 'Growth',
    seats: 50,
    preco: 'R$ 299/mês',
    benefits: [
      'Até 50 alunos',
      'Plano Premium para todos',
      'IA ilimitada',
      'Suporte prioritário',
    ],
  },
]

export function CriarOrgFlow() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [nome, setNome] = useState('')
  const [planoEscolhido, setPlanoEscolhido] = useState<'STARTER' | 'GROWTH'>('STARTER')

  const criar = trpc.org.criar.useMutation({
    onSuccess: async () => {
      toast.success('Organização criada com 14 dias de teste grátis')
      await utils.org.status.invalidate()
      router.push('/org')
      router.refresh()
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao criar'),
  })

  const submeter = () => {
    if (nome.trim().length < 2) {
      toast.error('Dê um nome de pelo menos 2 caracteres')
      return
    }
    criar.mutate({ nome: nome.trim(), plano: planoEscolhido })
  }

  return (
    <div className="mt-8 space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Label htmlFor="nome" className="flex items-center gap-2">
            <Building2 className="size-4" />
            Nome da organização
          </Label>
          <Input
            id="nome"
            placeholder="Ex: Cursinho Beira-Rio"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="text-base"
            maxLength={100}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Você pode mudar depois. Vamos gerar um identificador único automaticamente a partir do
            nome.
          </p>
        </CardContent>
      </Card>

      <div>
        <Label className="text-base">Escolha o plano</Label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {PLANOS.map((p) => {
            const ativo = planoEscolhido === p.codigo
            return (
              <button
                key={p.codigo}
                type="button"
                onClick={() => setPlanoEscolhido(p.codigo)}
                className={cn(
                  'flex flex-col items-start rounded-xl border p-4 text-left transition-all',
                  ativo ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-primary/50',
                )}
              >
                <div className="flex w-full items-start justify-between">
                  <div>
                    <div className="font-semibold">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.seats} seats incluídos</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{p.preco}</div>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-1.5">
                      <Check className="size-3 shrink-0 text-primary mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Você terá 14 dias de teste antes da cobrança começar. A assinatura é configurada após
          criar a organização.
        </p>
      </div>

      <Button size="lg" onClick={submeter} loading={criar.isPending} className="w-full">
        Criar organização
      </Button>
    </div>
  )
}
