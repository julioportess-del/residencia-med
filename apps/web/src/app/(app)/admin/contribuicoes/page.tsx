import { exigirAdmin } from '@/lib/auth'
import { ContribuicoesAdmin } from './_components/contribuicoes-admin'

export const metadata = { title: 'Contribuições — Admin' }

export default async function AdminContribuicoesPage() {
  await exigirAdmin()
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
