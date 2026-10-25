import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirAdmin } from '@/lib/auth'
import { AulasAdmin } from './_components/aulas-admin'

export const metadata = { title: 'Aulas — Admin' }

export default async function AdminAulasPage({
  params,
}: {
  params: Promise<{ grandeAreaId: string; disciplinaId: string }>
}) {
  await exigirAdmin()
  const { grandeAreaId, disciplinaId } = await params
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <Link
        href={`/admin/cursos/${grandeAreaId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Disciplinas
      </Link>
      <AulasAdmin grandeAreaId={grandeAreaId} disciplinaId={disciplinaId} />
    </div>
  )
}
