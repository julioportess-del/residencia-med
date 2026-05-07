'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Session, User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { supabaseBrowser } from '@/lib/supabase/client'
import { trpc } from '@/lib/trpc/client'

type Props = {
  plano: 'PRO' | 'PREMIUM'
  destaque?: boolean
}

export function PrecosUpgradeButton({ plano, destaque }: Props) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    const supabase = supabaseBrowser()
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      setUser(data.user)
      setCarregado(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null)
      },
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  const checkout = trpc.billing.iniciarCheckout.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao iniciar checkout'),
  })

  const onClick = () => {
    if (!carregado) return
    if (!user) {
      router.push('/sign-up?next=/precos')
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

export function PrecosUpgradeButtonDemo({ plano, destaque }: Props) {
  const router = useRouter()
  return (
    <Button
      variant={destaque ? 'primary' : 'outline'}
      className="w-full"
      onClick={() => router.push('/setup')}
    >
      Assinar {plano}
    </Button>
  )
}
