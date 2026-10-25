import { DesempenhoCliente } from './_components/desempenho-cliente'

export const metadata = { title: 'Desempenho' }

export default function DesempenhoPage() {
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">Desempenho</h1>
      <p className="mt-2 text-muted-foreground">
        Suas atividades por especialidade e tema. Filtre pelo que quer examinar.
      </p>
      <DesempenhoCliente />
    </div>
  )
}
