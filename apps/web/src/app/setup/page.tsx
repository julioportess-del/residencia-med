import Link from 'next/link'
import { AlertCircle, Check, X } from 'lucide-react'

export const metadata = { title: 'Configuracao' }

const credenciais = [
  {
    chave: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    nome: 'Clerk (auth)',
    descricao: 'Sign-in, sign-up, sessoes',
    onde: 'https://dashboard.clerk.com → API Keys',
    tempo: '2 min',
    obrigatoria: true,
  },
  {
    chave: 'CLERK_SECRET_KEY',
    nome: 'Clerk Secret',
    descricao: 'Servidor valida sessoes',
    onde: 'mesmo lugar acima',
    tempo: '0',
    obrigatoria: true,
  },
  {
    chave: 'DATABASE_URL',
    nome: 'Postgres + pgvector',
    descricao: 'Banco de questoes, respostas, sessoes',
    onde: 'https://neon.tech → Create Project (free tier)',
    tempo: '3 min',
    obrigatoria: true,
  },
  {
    chave: 'ANTHROPIC_API_KEY',
    nome: 'Anthropic Claude',
    descricao: 'Explicacoes IA dinamicas',
    onde: 'https://console.anthropic.com → API Keys',
    tempo: '2 min',
    obrigatoria: false,
  },
  {
    chave: 'STRIPE_SECRET_KEY',
    nome: 'Stripe',
    descricao: 'Cobranca PRO/PREMIUM',
    onde: 'https://dashboard.stripe.com → Developers → API keys',
    tempo: '5 min',
    obrigatoria: false,
  },
  {
    chave: 'REDIS_URL',
    nome: 'Upstash Redis',
    descricao: 'Cache + rate limit + filas',
    onde: 'https://upstash.com → Create Database (free)',
    tempo: '2 min',
    obrigatoria: false,
  },
]

export default function SetupPage() {
  const valida = (chave: string) => {
    const v = process.env[chave]
    return Boolean(v && !v.includes('placeholder') && !v.startsWith('sk_test_p') && !v.startsWith('pk_test_p'))
  }

  return (
    <main className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs">
          <AlertCircle className="size-3" />
          Modo demo — credenciais nao configuradas
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Bem-vindo ao Residencia Med</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          A app esta no ar mas precisa de credenciais externas para liberar auth, banco e IA.
          Cada uma e free tier instantaneo. Total: ~15 minutos.
        </p>

        <div className="mt-8 space-y-3">
          {credenciais.map((c) => {
            const ok = valida(c.chave)
            return (
              <div
                key={c.chave}
                className="flex items-start gap-4 rounded-xl border bg-background p-4"
              >
                <div
                  className={
                    ok
                      ? 'flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100'
                      : 'flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-100'
                  }
                >
                  {ok ? <Check className="size-4 text-emerald-600" /> : <X className="size-4 text-rose-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.nome}</h3>
                    {c.obrigatoria && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        Obrigatoria
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">~{c.tempo}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Onde criar: <code className="rounded bg-muted px-1">{c.onde}</code>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Variavel: <code className="rounded bg-muted px-1 font-mono">{c.chave}</code>
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-xl border bg-background p-6">
          <h2 className="text-lg font-semibold">Proximos passos</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Crie as contas necessarias (todas tem free tier sem cartao).</li>
            <li>
              Cole as chaves nas{' '}
              <a
                className="text-primary underline"
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener"
              >
                Settings &gt; Environment Variables
              </a>{' '}
              do projeto Vercel.
            </li>
            <li>Trigger redeploy: aba Deployments → ⋯ → Redeploy.</li>
            <li>App entra em modo completo automaticamente.</li>
          </ol>
        </div>

        <div className="mt-6 text-sm">
          <Link href="/" className="text-primary underline">
            ← Voltar para a landing
          </Link>{' '}
          ·{' '}
          <Link href="/precos" className="text-primary underline">
            Ver planos
          </Link>
        </div>
      </div>
    </main>
  )
}
