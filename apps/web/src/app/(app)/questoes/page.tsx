import { QuestoesLista } from './_components/questoes-lista'

export const metadata = { title: 'Banco de questoes' }

export default function QuestoesPage() {
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">Banco de questoes</h1>
      <p className="mt-2 text-muted-foreground">
        Filtre por banca, dificuldade ou tema. Clique para responder.
      </p>
      <QuestoesLista />
    </div>
  )
}
