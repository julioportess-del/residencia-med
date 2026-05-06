import { PlanoSemana } from './_components/plano-semana'

export const metadata = { title: 'Plano de estudo' }

export default function PlanoPage() {
  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-3xl font-bold">Plano de estudo</h1>
      <p className="mt-2 text-muted-foreground">Distribuicao da semana atual.</p>
      <PlanoSemana />
    </div>
  )
}
