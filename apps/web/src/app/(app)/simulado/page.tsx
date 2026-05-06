import { SimuladoConfig } from './_components/simulado-config'

export const metadata = { title: 'Simulado' }

export default function SimuladoPage() {
  return (
    <div className="container mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-3xl font-bold">Novo simulado</h1>
      <p className="mt-2 text-muted-foreground">
        Configure as questoes, comece e cronometro liga automaticamente.
      </p>
      <SimuladoConfig />
    </div>
  )
}
