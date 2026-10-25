import { IndicadoresCliente } from './_components/indicadores-cliente'

export const metadata = { title: 'Indicadores' }

export default function IndicadoresPage() {
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">Indicadores</h1>
      <p className="mt-2 text-muted-foreground">
        Totais e desempenho por assunto — como está sua prática no período escolhido.
      </p>
      <IndicadoresCliente />
    </div>
  )
}
