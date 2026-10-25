import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirAdmin } from '@/lib/auth'
import { DisciplinasAdmin } from './_components/disciplinas-admin'

export const metadata = { title: 'Disciplinas — Admin' }

export default async function AdminDisciplinasPage({
  params,
}: {
  params: Promise<{ grandeAreaId: string }>
}) {
  await exigirAdmin()
  const { grandeAreaId } = await params
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <Link
        href="/admin/cursos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Grandes áreas
      </Link>
      <DisciplinasAdmin grandeAreaId={grandeAreaId} />
    </div>
  )
}
