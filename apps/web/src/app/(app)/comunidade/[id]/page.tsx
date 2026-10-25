import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PostDetalhe } from './_components/post-detalhe'

export const metadata = { title: 'Post' }

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="container mx-auto max-w-3xl px-6 py-6">
      <Link
        href="/comunidade"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Comunidade
      </Link>
      <PostDetalhe id={id} />
    </div>
  )
}
