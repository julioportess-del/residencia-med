import { redirect } from 'next/navigation'
import { supabaseUserAtual } from '@/lib/supabase/server'
import { garantirUser } from '@/server/trpc'
import { AppShell } from './_components/app-shell'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user: authUser } = await supabaseUserAtual()
  if (!authUser?.email) redirect('/sign-in')

  const user = await garantirUser(authUser.id, authUser.email)
  const onboardingCompleto = Boolean(
    user.bancasAlvo.length > 0 &&
      user.dataProva &&
      user.cargaHorariaSemanal &&
      user.metaResidencia,
  )

  return (
    <AppShell
      user={{
        nome: user.name ?? user.email.split('@')[0] ?? 'Estudante',
        email: user.email,
      }}
      onboardingCompleto={onboardingCompleto}
    >
      {children}
    </AppShell>
  )
}
