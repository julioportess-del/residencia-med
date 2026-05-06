import { ApiKeysShell } from './_components/api-keys-shell'

export const metadata = { title: 'Chaves de API' }

export default function OrgApiPage() {
  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-bold">Chaves de API</h1>
      <p className="mt-2 text-muted-foreground">
        Gere chaves para integrar a Residência Med ao sistema da sua equipe. A documentação está em{' '}
        <a href="/docs/api" className="text-primary underline">
          /docs/api
        </a>
        .
      </p>
      <ApiKeysShell />
    </div>
  )
}
