import { LiveSala } from './_components/live-sala'

export default async function LiveSalaPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params
  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      <LiveSala codigo={codigo.toUpperCase()} />
    </div>
  )
}
