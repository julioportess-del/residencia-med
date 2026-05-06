import { DashboardClient } from './_components/dashboard-client'

export const metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">Visao geral</h1>
      <p className="mt-2 text-muted-foreground">Seu progresso nos ultimos dias.</p>
      <DashboardClient />
    </div>
  )
}
