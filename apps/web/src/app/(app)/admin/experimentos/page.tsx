import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { garantirUser } from '@/server/trpc'
import { ExperimentosLista } from './_components/experimentos-lista'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const metadata = { title: 'A/B tests' }

export default async function ExperimentosPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await garantirUser(userId)
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect('/dashboard')
  }
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">A/B tests</h1>
      <p className="mt-2 text-muted-foreground">
        Crie experimentos, atribua variantes determinísticas por usuário e acompanhe resultados.
      </p>
      <ExperimentosLista />
    </div>
  )
}
