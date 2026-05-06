import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { PLANOS_B2C, precoFormatado } from '@residencia-med/billing/plans'
import { clerkHabilitado } from '@/lib/flags'
import {
  PrecosUpgradeButton,
  PrecosUpgradeButtonDemo,
} from './_components/upgrade-button'

export const metadata = { title: 'Precos' }

export default function PrecosPage() {
  const ordem: Array<keyof typeof PLANOS_B2C> = ['FREE', 'PRO', 'PREMIUM']
  const Botao = clerkHabilitado() ? PrecosUpgradeButton : PrecosUpgradeButtonDemo
  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3" />
            Planos
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Escolha o ritmo da sua aprovacao
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Comece gratis. Suba para Pro quando precisar de IA e simulados ilimitados. Premium libera
            geracao de questoes parecidas e prioridade na fila.
          </p>
        </div>
      </header>

      <section className="container mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {ordem.map((codigo) => {
            const p = PLANOS_B2C[codigo]
            const destaque = codigo === 'PRO'
            return (
              <div
                key={codigo}
                className={
                  destaque
                    ? 'rounded-xl border-2 border-primary bg-background p-6 shadow-md'
                    : 'rounded-xl border bg-background p-6'
                }
              >
                {destaque && (
                  <div className="mb-3 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
                    Mais escolhido
                  </div>
                )}
                <h2 className="text-2xl font-bold">{p.nome}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.descricao}</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold">{precoFormatado(p.precoMensalCentavos)}</span>
                  {p.precoMensalCentavos > 0 && (
                    <span className="text-muted-foreground"> /mes</span>
                  )}
                </div>
                {p.precoAnualCentavos > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    ou {precoFormatado(p.precoAnualCentavos)} no anual ({Math.round((1 - p.precoAnualCentavos / (p.precoMensalCentavos * 12)) * 100)}% off)
                  </p>
                )}

                <ul className="mt-6 space-y-2 text-sm">
                  {p.destaques.map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {codigo === 'FREE' ? (
                    <Link
                      href="/sign-up"
                      className="inline-flex h-10 w-full items-center justify-center rounded-md border bg-background text-sm font-medium hover:bg-accent"
                    >
                      Comecar gratis
                    </Link>
                  ) : (
                    <Botao plano={codigo} destaque={destaque} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 rounded-lg border bg-secondary/50 p-6 text-sm">
          <strong>Para cursinhos e equipes:</strong> temos planos B2B com painel de admin, seats por
          aluno e relatorios agregados.{' '}
          <Link href="mailto:contato@residencia-med.com" className="text-primary underline">
            Fale com vendas
          </Link>
          .
        </div>
      </section>
    </main>
  )
}
