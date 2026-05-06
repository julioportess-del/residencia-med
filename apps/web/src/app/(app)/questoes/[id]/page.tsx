import { QuestaoDetalhe } from './_components/questao-detalhe'

export default async function QuestaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="container mx-auto max-w-3xl px-6 py-8">
      <QuestaoDetalhe id={id} />
    </div>
  )
}
