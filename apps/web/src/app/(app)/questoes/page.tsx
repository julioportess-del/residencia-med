import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { QuestoesLista } from './_components/questoes-lista'

export const metadata = { title: 'Banco de questões' }

export default function QuestoesPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Banco de questões</h1>
      <p className="mt-2 text-muted-foreground">
        Combine filtros ou use uma lista inteligente. Estude no modo correção a cada questão ou faça
        como prova.
      </p>
      <Suspense fallback={<Skeleton className="mt-6 h-96 w-full" />}>
        <QuestoesLista />
      </Suspense>
    </div>
  )
}
