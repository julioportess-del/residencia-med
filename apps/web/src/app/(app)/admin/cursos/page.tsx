import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirAdmin } from '@/lib/auth'
import { CursosAnalytics } from './_components/cursos-analytics'
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
      <h1 className="mt-2 text-3xl font-bold">Cursos</h1>
      <p className="mt-2 text-muted-foreground">
        Métricas de consumo e CRUD das grandes áreas, disciplinas e aulas.
      </p>

      <CursosAnalytics />

      <h2 className="mt-10 text-2xl font-bold">Grandes áreas</h2>
      <GrandesAreasAdmin />
    </div>
  )
}
