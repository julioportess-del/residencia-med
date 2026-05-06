'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/lib/trpc/client'

export function AceitarConvite({ token }: { token: string }) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const aceitar = trpc.org.aceitarConvite.useMutation({
    onSuccess: async (r) => {
      toast.success(`Bem-vindo à equipe ${r.nomeOrg}`)
      await utils.org.status.invalidate()
      router.push('/org')
      router.refresh()
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao aceitar convite'),
  })

  return (
    <Card>
      <CardContent className="pt-8 pb-6 text-center space-y-4">
        <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Aceitar convite</h1>
        <p className="text-muted-foreground text-sm">
          Você foi convidado a entrar em uma organização do Residência Med. Ao aceitar, você ganha
          acesso ao plano contratado pela equipe sem custo adicional.
        </p>

        {aceitar.isSuccess ? (
          <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
            <Check className="mx-auto mb-2 size-5" />
            Convite aceito com sucesso. Redirecionando...
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={() => aceitar.mutate({ token })}
              loading={aceitar.isPending}
              size="lg"
              className="w-full"
            >
              Aceitar convite
            </Button>
            <Link
              href="/dashboard"
              className="block text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar e voltar
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
