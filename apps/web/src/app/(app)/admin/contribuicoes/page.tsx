import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { garantirUser } from '@/server/trpc'
import { ContribuicoesAdmin } from './_components/contribuicoes-admin'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const metadata = { title: 'Contribuições — Admin' }

export default async function AdminContribuicoesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await garantirUser(userId)
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect('/dashboard')
  }
  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-3xl font-bold">Fila de contribuições</h1>
      <p className="mt-2 text-muted-foreground">
        Revise submissões da comunidade. A IA já filtrou as obviamente ruins.
      </p>
      <ContribuicoesAdmin />
    </div>
  )
}
