import Link from 'next/link'
import { ArrowRight, Brain, ChartLine, Sparkles, Target } from 'lucide-react'
import { Button } from '@residencia-med/ui'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto max-w-6xl px-6 pt-24 pb-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="size-3" />
              Plataforma em fase inicial
            </div>
            <h1 className="text-balance font-bold tracking-tight text-5xl md:text-7xl">
              Aprovação em residência, <span className="text-primary">acelerada por dados</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl">
              Análise de 10 anos da sua banca, plano adaptativo, repetição espaçada e cada erro
              explicado com guideline. Fim do estudo às cegas.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/sign-up">
                <Button size="lg">
                  Começar grátis <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/precos">
                <Button size="lg" variant="outline">
                  Ver planos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-b">
        <div className="container mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Como funciona</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Feature
              icon={<Target className="size-5" />}
              titulo="Banca-alvo definida"
              desc="Você escolhe a banca; analisamos as últimas 10 provas e ranqueamos os temas."
            />
            <Feature
              icon={<ChartLine className="size-5" />}
              titulo="Plano adaptativo"
              desc="Distribuição da carga horária nos temas que mais caem e onde você está pior."
            />
            <Feature
              icon={<Brain className="size-5" />}
              titulo="Repetição espaçada"
              desc="SM-2 modificado: os erros voltam em intervalos calculados até o dia da prova."
            />
            <Feature
              icon={<Sparkles className="size-5" />}
              titulo="Erro explicado"
              desc="Cada questão errada vem com guideline citado e o motivo de cada alternativa estar incorreta."
            />
          </div>
        </div>
      </section>

      <section className="border-b bg-secondary/40">
        <div className="container mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-bold tracking-tight">Bancas cobertas</h2>
          <p className="mt-2 text-muted-foreground">
            Análise completa das principais provas brasileiras.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              'AMRIGS',
              'ENARE',
              'PSU-MG',
              'IPSEMG',
              'USP',
              'SUS-SP',
              'SES-SC',
              'BH',
              'UNIFESP',
              'UNICAMP',
              'UFRJ',
              'HCPA',
              'UFPR',
              'FMRP-USP',
            ].map((b) => (
              <span
                key={b}
                className="rounded-full border bg-background px-4 py-2 text-sm font-medium"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="container mx-auto max-w-6xl px-6 py-12 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>© 2026 Residência Med</span>
          <span>Plataforma em fase inicial</span>
        </div>
      </footer>
    </main>
  )
}

function Feature({
  icon,
  titulo,
  desc,
}: {
  icon: React.ReactNode
  titulo: string
  desc: string
}) {
  return (
    <div className="rounded-xl border bg-background p-6">
      <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{titulo}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}
