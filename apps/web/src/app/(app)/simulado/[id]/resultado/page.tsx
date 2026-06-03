import { ResultadoSimulado } from './_components/resultado'

export default async function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="container mx-auto max-w-3xl px-6 py-8">
      <ResultadoSimulado sessaoId={id} />
    </div>
  )
}
