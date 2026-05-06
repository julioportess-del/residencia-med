'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc/client'

type Org = {
  id: string
  name: string
  plano: string
  membros: number
  seats: number
}

export function OrgMembroPanel({ org, papel }: { org: Org; papel: string }) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const sair = trpc.org.sair.useMutation({
    onSuccess: async () => {
      toast.success('Você saiu da organização')
      await utils.org.status.invalidate()
      router.push('/dashboard')
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao sair'),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{org.name}</h1>
        <p className="mt-2 text-muted-foreground">Sua organização no Residência Med.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{org.name}</CardTitle>
              <CardDescription>
                {org.membros} {org.membros === 1 ? 'membro' : 'membros'} · plano {org.plano}
              </CardDescription>
            </div>
            <Badge variant="outline">{papel}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Como membro, você usa o plano contratado pela equipe sem custo adicional. Apenas
            administradores podem convidar pessoas, gerenciar seats e cobrança.
          </p>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        onClick={() => {
          if (confirm('Sair da organização? Você voltará para o plano Free.')) {
            sair.mutate()
          }
        }}
        loading={sair.isPending}
      >
        <LogOut className="size-4" />
        Sair da organização
      </Button>
    </div>
  )
}
