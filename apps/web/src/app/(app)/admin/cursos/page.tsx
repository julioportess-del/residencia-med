import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirAdmin } from '@/lib/auth'
import { GrandesAreasAdmin } from './_components/grandes-areas-admin'

export const metadata = { title: 'Cursos — Admin' }

export default async function AdminCursosPage() {
  await exigirAdmin()
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Painel admin
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Grandes áreas</h1>
      <p className="mt-2 text-muted-foreground">
        Estruture o LMS: cadastre grandes áreas, suas disciplinas e aulas, e publique quando estiver pronto.
      </p>
      <GrandesAreasAdmin />
    </div>
  )
}
