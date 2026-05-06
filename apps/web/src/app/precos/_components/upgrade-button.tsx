'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'

type Props = {
  plano: 'PRO' | 'PREMIUM'
  destaque?: boolean
}

export function PrecosUpgradeButton({ plano, destaque }: Props) {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  const checkout = trpc.billing.iniciarCheckout.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao iniciar checkout'),
  })

  const onClick = () => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=/precos`)
      return
    }
    checkout.mutate({ plano, ciclo: 'monthly' })
  }

  return (
    <Button
      variant={destaque ? 'primary' : 'outline'}
      className="w-full"
      onClick={onClick}
      loading={checkout.isPending}
    >
      Assinar {plano}
    </Button>
  )
}
