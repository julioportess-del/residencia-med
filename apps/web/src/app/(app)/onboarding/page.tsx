import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@residencia-med/db'
import { garantirUser } from '@/server/trpc'
import { OnboardingFlow } from './_components/onboarding-flow'

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await garantirUser(userId)
  const completo = Boolean(
    user.bancasAlvo.length > 0 &&
      user.dataProva &&
      user.cargaHorariaSemanal &&
      user.metaResidencia,
  )
  if (completo) redirect('/dashboard')

  const bancas = await prisma.banca.findMany({
    orderBy: [{ prioridade: 'desc' }, { nome: 'asc' }],
    select: { id: true, codigo: true, nome: true, estado: true, cor: true },
  })

  return <OnboardingFlow bancas={bancas} />
}
