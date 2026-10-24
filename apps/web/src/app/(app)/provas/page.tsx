import { MinhasProvasClient } from './_components/minhas-provas-client'

export const metadata = { title: 'Minhas provas' }

export default function MinhasProvasPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Minhas provas</h1>
      <p className="mt-2 text-muted-foreground">
        Acompanhe cada processo seletivo: edital, inscrição, logística, prova e resultado.
      </p>
      <MinhasProvasClient />
    </div>
  )
}
