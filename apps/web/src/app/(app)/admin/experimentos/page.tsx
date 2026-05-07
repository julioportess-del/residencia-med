import { exigirAdmin } from '@/lib/auth'
import { ExperimentosLista } from './_components/experimentos-lista'

export const metadata = { title: 'A/B tests' }

export default async function ExperimentosPage() {
  await exigirAdmin()
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
