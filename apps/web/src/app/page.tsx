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
              Em desenvolvimento — Turno 1 concluido
            </div>
            <h1 className="text-balance font-bold tracking-tight text-5xl md:text-7xl">
              Aprovacao em residencia, <span className="text-primary">acelerada por dados</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl">
              Analise de 10 anos da sua banca, plano adaptativo, repeticao espacada e cada erro
              explicado com guideline. Fim do estudo as cegas.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/sign-up">
                <Button size="lg">
                  Comecar gratis <ArrowRight className="size-4" />
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
              desc="Voce escolhe a banca; analisamos as ultimas 10 provas e ranqueamos temas."
            />
            <Feature
              icon={<ChartLine className="size-5" />}
              titulo="Plano adaptativo"
              desc="Distribuicao da carga horaria nos temas que mais caem e onde voce esta pior."
            />
            <Feature
              icon={<Brain className="size-5" />}
              titulo="Repeticao espacada"
              desc="SM-2 modificado: erros voltam em intervalos calculados ate o dia da prova."
            />
            <Feature
              icon={<Sparkles className="size-5" />}
              titulo="Erro explicado"
              desc="Cada questao errada vem com guideline citado e por que cada alternativa e errada."
            />
          </div>
        </div>
      </section>

      <section className="border-b bg-secondary/40">
        <div className="container mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-bold tracking-tight">Bancas cobertas</h2>
          <p className="mt-2 text-muted-foreground">
            Analise completa para as principais provas brasileiras.
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
          <span>© 2026 Residencia Med</span>
          <span>Em desenvolvimento</span>
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
