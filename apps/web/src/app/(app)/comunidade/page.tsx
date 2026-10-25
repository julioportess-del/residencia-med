import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComunidadeFeed } from './_components/comunidade-feed'

export const metadata = { title: 'Comunidade' }

export default function ComunidadePage() {
  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Comunidade</h1>
          <p className="mt-2 text-muted-foreground">
            Discussões, dúvidas, dicas e desabafos de outros candidatos.
          </p>
        </div>
        <Link href="/comunidade/novo">
          <Button>
            <Plus className="size-4" /> Novo post
          </Button>
        </Link>
      </div>
      <ComunidadeFeed />
    </div>
  )
}
