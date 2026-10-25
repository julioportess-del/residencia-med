import { CursosFasesList } from './_components/cursos-fases-list'

export const metadata = { title: 'Cursos' }

export default function CursosPage() {
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">Cursos em vídeo</h1>
      <p className="mt-2 text-muted-foreground">
        Vídeo-aulas organizadas por Grande Área → Disciplina → Aula. Escolha a fase do seu preparo.
      </p>
      <CursosFasesList />
    </div>
  )
}
