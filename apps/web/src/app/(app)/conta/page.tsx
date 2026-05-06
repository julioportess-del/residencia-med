import { ContaCliente } from './_components/conta-cliente'

export const metadata = { title: 'Conta' }

export default function ContaPage() {
  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-bold">Conta e assinatura</h1>
      <p className="mt-2 text-muted-foreground">
        Gerencie seu plano, uso do mes e exporte/exclua seus dados.
      </p>
      <ContaCliente />
    </div>
  )
}
