import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AulaPlayer } from './_components/aula-player'

export const metadata = { title: 'Aula' }

export default async function AulaPage({
  params,
}: {
  params: Promise<{ fase: string; area: string; disciplina: string; aula: string }>
}) {
  const { fase: faseParam, area, disciplina, aula } = await params
  const fase = faseFromSlug(faseParam)
  if (!fase) notFound()

  return (
    <div className="container mx-auto max-w-6xl px-6 py-6">
      <Link
        href={`/cursos/${faseParam}/${area}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Voltar à área
      </Link>
      <AulaPlayer fase={fase} areaSlug={area} disciplinaSlug={disciplina} aulaSlug={aula} />
    </div>
  )
}

function faseFromSlug(slug: string): 'EXTENSIVO' | 'RETA_FINAL' | null {
  if (slug === 'extensivo') return 'EXTENSIVO'
  if (slug === 'reta-final') return 'RETA_FINAL'
  return null
}
