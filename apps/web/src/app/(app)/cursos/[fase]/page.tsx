import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GrandesAreasList } from './_components/grandes-areas-list'

export const metadata = { title: 'Grandes Áreas' }

export default async function CursosFasePage({ params }: { params: Promise<{ fase: string }> }) {
  const { fase: faseParam } = await params
  const fase = faseFromSlug(faseParam)
  if (!fase) notFound()

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <Link
        href="/cursos"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Fases
      </Link>
      <h1 className="mt-2 text-3xl font-bold">
        {fase === 'EXTENSIVO' ? 'Extensivo' : 'Reta Final'}
      </h1>
      <p className="mt-2 text-muted-foreground">Grandes áreas disponíveis.</p>
      <GrandesAreasList fase={fase} />
    </div>
  )
}

function faseFromSlug(slug: string): 'EXTENSIVO' | 'RETA_FINAL' | null {
  if (slug === 'extensivo') return 'EXTENSIVO'
  if (slug === 'reta-final') return 'RETA_FINAL'
  return null
}
