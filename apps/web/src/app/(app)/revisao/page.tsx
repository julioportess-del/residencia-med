import { RevisaoLista } from './_components/revisao-lista'

export const metadata = { title: 'Revisão' }

export default function RevisaoPage() {
  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-bold">Revisão do dia</h1>
      <p className="mt-2 text-muted-foreground">
        Itens vencidos do SuperMemo-2. Acertar com confiança aumenta o intervalo; errar reseta.
      </p>
      <RevisaoLista />
    </div>
  )
}
