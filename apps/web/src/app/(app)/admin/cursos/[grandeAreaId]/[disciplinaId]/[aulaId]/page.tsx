import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirAdmin } from '@/lib/auth'
import { AulaAdminDetalhe } from './_components/aula-admin-detalhe'

export const metadata = { title: 'Editar aula — Admin' }

export default async function AdminAulaPage({
  params,
}: {
  params: Promise<{ grandeAreaId: string; disciplinaId: string; aulaId: string }>
}) {
  await exigirAdmin()
  const { grandeAreaId, disciplinaId, aulaId } = await params
  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      <Link
        href={`/admin/cursos/${grandeAreaId}/${disciplinaId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Aulas
      </Link>
      <AulaAdminDetalhe aulaId={aulaId} />
    </div>
  )
}
