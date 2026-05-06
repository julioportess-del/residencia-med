import Link from 'next/link'

export const metadata = { title: 'Documentação da API' }

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen">
      <div className="border-b">
        <div className="container mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">API Pública v1</h1>
            <p className="text-sm text-muted-foreground">
              Documentação OpenAPI 3.1 — para integradores B2B
            </p>
          </div>
          <Link href="/api/v1/openapi.json" className="text-sm text-primary underline">
            Baixar openapi.json
          </Link>
        </div>
      </div>
      <div className="h-[calc(100vh-100px)]">
        <iframe
          src="https://redocly.github.io/redoc/?url=https%3A%2F%2Fresidencia-med.vercel.app%2Fapi%2Fv1%2Fopenapi.json"
          className="h-full w-full border-0"
          title="Documentação da API"
        />
      </div>
    </main>
  )
}
