import { NovoPostForm } from './_components/novo-post-form'

export const metadata = { title: 'Novo post' }

export default function NovoPostPage() {
  return (
    <div className="container mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-3xl font-bold">Novo post</h1>
      <p className="mt-2 text-muted-foreground">Compartilhe algo com a comunidade.</p>
      <NovoPostForm />
    </div>
  )
}
