import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AreaDetalhe } from './_components/area-detalhe'

export const metadata = { title: 'Disciplinas' }

export default async function CursosAreaPage({
  params,
}: {
  params: Promise<{ fase: string; area: string }>
}) {
  const { fase: faseParam, area } = await params
  const fase = faseFromSlug(faseParam)
  if (!fase) notFound()

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <Link
        href={`/cursos/${faseParam}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> {fase === 'EXTENSIVO' ? 'Extensivo' : 'Reta Final'}
      </Link>
      <AreaDetalhe fase={fase} areaSlug={area} />
    </div>
  )
}

function faseFromSlug(slug: string): 'EXTENSIVO' | 'RETA_FINAL' | null {
  if (slug === 'extensivo') return 'EXTENSIVO'
  if (slug === 'reta-final') return 'RETA_FINAL'
  return null
}
