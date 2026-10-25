import Link from 'next/link'
import { BarChart3, BookOpen, Flag, FlaskConical, LifeBuoy, MessageSquarePlus } from 'lucide-react'
import { exigirAdmin } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { AdminDashboard } from './_components/admin-dashboard'

export const metadata = { title: 'Admin' }

const ATALHOS = [
  {
    href: '/admin/cursos',
    icone: BookOpen,
    titulo: 'Cursos',
    descricao: 'Grandes áreas, disciplinas, aulas, vídeos e materiais.',
  },
  {
    href: '/admin/tickets',
    icone: LifeBuoy,
    titulo: 'Suporte',
    descricao: 'Fila de tickets abertos pelos usuários.',
  },
  {
    href: '/admin/comunidade',
    icone: Flag,
    titulo: 'Moderação',
    descricao: 'Fila de denúncias de posts e comentários.',
  },
  {
    href: '/admin/contribuicoes',
    icone: MessageSquarePlus,
    titulo: 'Contribuições',
    descricao: 'Fila de questões submetidas pela comunidade.',
  },
  {
    href: '/admin/exec',
    icone: BarChart3,
    titulo: 'Painel executivo',
    descricao: 'Receita, crescimento e contas B2B.',
  },
  {
    href: '/admin/experimentos',
    icone: FlaskConical,
    titulo: 'Experimentos',
    descricao: 'A/B tests e feature flags.',
  },
]

export default async function AdminPage() {
  await exigirAdmin()
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">Painel admin</h1>
      <p className="mt-2 text-muted-foreground">MRR, ativos e custo de IA.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {ATALHOS.map((a) => (
          <Link key={a.href} href={a.href} className="block">
            <Card className="h-full transition-colors hover:border-primary">
              <CardContent className="pt-6">
                <a.icone className="h-5 w-5 text-primary" />
                <div className="mt-2 font-semibold">{a.titulo}</div>
                <p className="mt-1 text-xs text-muted-foreground">{a.descricao}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <AdminDashboard />
    </div>
  )
}
