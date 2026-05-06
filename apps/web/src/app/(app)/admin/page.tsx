import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { garantirUser } from '@/server/trpc'
import { AdminDashboard } from './_components/admin-dashboard'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const metadata = { title: 'Admin' }

export default async function AdminPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await garantirUser(userId)
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect('/dashboard')
  }
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">Painel admin</h1>
      <p className="mt-2 text-muted-foreground">MRR, ativos e custo de IA.</p>
      <AdminDashboard />
    </div>
  )
}
