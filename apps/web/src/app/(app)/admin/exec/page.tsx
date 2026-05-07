import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { garantirUser } from '@/server/trpc'
import { ExecDashboard } from './_components/exec-dashboard'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const metadata = { title: 'Painel executivo' }

export default async function AdminExecPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await garantirUser(userId)
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect('/dashboard')
  }
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-3xl font-bold">Painel executivo</h1>
      <p className="mt-2 text-muted-foreground">
        Visão consolidada de receita, crescimento, custo de IA e top contas B2B.
      </p>
      <ExecDashboard />
    </div>
  )
}
