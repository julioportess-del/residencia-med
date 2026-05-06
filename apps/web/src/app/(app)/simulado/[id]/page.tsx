import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@residencia-med/db'
import { SimuladoRunner } from './_components/simulado-runner'

export default async function SimuladoExecPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const sessao = await prisma.sessao.findFirst({
    where: { id, user: { clerkId } },
  })
  if (!sessao) redirect('/simulado')

  const config = sessao.configuracao as {
    questaoIds: string[]
    tempoMinutos?: number
    numeroQuestoes: number
  }

  if (sessao.finalizadaEm) {
    redirect(`/simulado/${id}/resultado`)
  }

  return (
    <SimuladoRunner
      sessaoId={sessao.id}
      questaoIds={config.questaoIds}
      tempoMinutos={config.tempoMinutos ?? 60}
    />
  )
}
