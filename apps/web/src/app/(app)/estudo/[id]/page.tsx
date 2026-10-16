import { redirect } from 'next/navigation'
import { prisma } from '@residencia-med/db'
import { exigirUser } from '@/lib/auth'
import { EstudoRunner } from './_components/estudo-runner'

export const metadata = { title: 'Sessão de estudo' }

export default async function EstudoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await exigirUser()

  const sessao = await prisma.sessao.findFirst({
    where: { id, userId: user.id },
    select: { id: true, configuracao: true, respostas: { select: { questaoId: true } } },
  })
  if (!sessao) redirect('/questoes')

  const { questaoIds } = sessao.configuracao as { questaoIds: string[] }
  const respondidas = new Set(sessao.respostas.map((r) => r.questaoId))
  // Retoma na primeira questão ainda não respondida nesta sessão
  const inicio = questaoIds.findIndex((qid) => !respondidas.has(qid))

  return (
    <div className="container mx-auto max-w-3xl px-6 py-8">
      <EstudoRunner
        sessaoId={sessao.id}
        questaoIds={questaoIds}
        indiceInicial={inicio === -1 ? questaoIds.length : inicio}
      />
    </div>
  )
}
