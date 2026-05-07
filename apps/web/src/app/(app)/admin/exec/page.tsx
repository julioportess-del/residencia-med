import { exigirAdmin } from '@/lib/auth'
import { ExecDashboard } from './_components/exec-dashboard'

export const metadata = { title: 'Painel executivo' }

export default async function AdminExecPage() {
  await exigirAdmin()
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
