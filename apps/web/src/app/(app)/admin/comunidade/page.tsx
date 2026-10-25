import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirAdmin } from '@/lib/auth'
import { ComunidadeAdmin } from './_components/comunidade-admin'

export const metadata = { title: 'Comunidade — Admin' }

export default async function AdminComunidadePage() {
  await exigirAdmin()
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Painel admin
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Moderação da comunidade</h1>
      <p className="mt-2 text-muted-foreground">
        Fila de denúncias pendentes. Ocultar remove o post/comentário da visão pública; Manter
        resolve sem ação.
      </p>
      <ComunidadeAdmin />
    </div>
  )
}
