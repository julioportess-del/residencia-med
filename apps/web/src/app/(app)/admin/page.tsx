import { exigirAdmin } from '@/lib/auth'
import { AdminDashboard } from './_components/admin-dashboard'

export const metadata = { title: 'Admin' }

export default async function AdminPage() {
  await exigirAdmin()
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">Painel admin</h1>
      <p className="mt-2 text-muted-foreground">MRR, ativos e custo de IA.</p>
      <AdminDashboard />
    </div>
  )
}
