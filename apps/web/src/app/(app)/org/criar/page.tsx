import { CriarOrgFlow } from './_components/criar-org-flow'

export const metadata = { title: 'Criar organização' }

export default function CriarOrgPage() {
  return (
    <div className="container mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">Criar organização</h1>
      <p className="mt-2 text-muted-foreground">
        Cursinhos, clínicas e equipes podem assinar planos B2B com seats por aluno e painel
        agregado. Você será o primeiro administrador.
      </p>
      <CriarOrgFlow />
    </div>
  )
}
