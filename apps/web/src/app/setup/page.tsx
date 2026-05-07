import Link from 'next/link'
import { AlertCircle, Check, X } from 'lucide-react'

export const metadata = { title: 'Configuração' }

const credenciais = [
  {
    chave: 'NEXT_PUBLIC_SUPABASE_URL',
    nome: 'Supabase (autenticação)',
    descricao: 'Cadastro, login e gestão de sessões',
    onde: 'https://supabase.com/dashboard → Project Settings → API',
    tempo: '2 min',
    obrigatoria: true,
  },
  {
    chave: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    nome: 'Supabase Anon Key',
    descricao: 'Chave pública usada no client e no server',
    onde: 'mesmo lugar acima',
    tempo: '0',
    obrigatoria: true,
  },
  {
    chave: 'DATABASE_URL',
    nome: 'Postgres + pgvector',
    descricao: 'Banco de questões, respostas e sessões de estudo',
    onde: 'https://neon.tech → Create Project (plano gratuito)',
    tempo: '3 min',
    obrigatoria: true,
  },
  {
    chave: 'ANTHROPIC_API_KEY',
    nome: 'Anthropic Claude',
    descricao: 'Explicações geradas por IA em tempo real',
    onde: 'https://console.anthropic.com → API Keys',
    tempo: '2 min',
    obrigatoria: false,
  },
  {
    chave: 'STRIPE_SECRET_KEY',
    nome: 'Stripe',
    descricao: 'Cobrança dos planos PRO e PREMIUM',
    onde: 'https://dashboard.stripe.com → Developers → API keys',
    tempo: '5 min',
    obrigatoria: false,
  },
  {
    chave: 'REDIS_URL',
    nome: 'Upstash Redis',
    descricao: 'Cache, rate limiting e fila de jobs',
    onde: 'https://upstash.com → Create Database (gratuito)',
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
          Modo de demonstração — credenciais ainda não configuradas
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Bem-vindo ao Residência Med</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          A aplicação já está no ar, mas precisa de credenciais externas para liberar
          autenticação, banco de dados e IA. Todas têm plano gratuito instantâneo.
          Tempo total estimado: 15 minutos.
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
                        Obrigatória
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">~{c.tempo}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Onde criar: <code className="rounded bg-muted px-1">{c.onde}</code>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Variável: <code className="rounded bg-muted px-1 font-mono">{c.chave}</code>
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-xl border bg-background p-6">
          <h2 className="text-lg font-semibold">Próximos passos</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Crie as contas necessárias (todas têm plano gratuito sem cartão).</li>
            <li>
              Cole as chaves em{' '}
              <a
                className="text-primary underline"
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener"
              >
                Settings &gt; Environment Variables
              </a>{' '}
              do projeto na Vercel.
            </li>
            <li>Acione um redeploy: aba Deployments → ⋯ → Redeploy.</li>
            <li>A aplicação entra em modo completo automaticamente.</li>
          </ol>
        </div>

        <div className="mt-6 text-sm">
          <Link href="/" className="text-primary underline">
            ← Voltar para a página inicial
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
