import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@residencia-med/db'
import { garantirUser } from '@/server/trpc'
import { AppShell } from './_components/app-shell'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await garantirUser(userId)
  const onboardingCompleto = Boolean(
    user.bancasAlvo.length > 0 &&
      user.dataProva &&
      user.cargaHorariaSemanal &&
      user.metaResidencia,
  )

  void prisma
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
