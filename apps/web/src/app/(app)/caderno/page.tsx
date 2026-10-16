import { CadernoErros } from './_components/caderno-erros'

export const metadata = { title: 'Caderno de erros' }

export default function CadernoPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Caderno de erros</h1>
      <p className="mt-2 text-muted-foreground">
        Toda questão que você errou entra aqui automaticamente. Registre o motivo e o conceito
        correto — é isso que transforma erro em aprendizado.
      </p>
      <CadernoErros />
    </div>
  )
}
