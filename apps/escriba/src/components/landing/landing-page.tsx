import Link from 'next/link'
import {
  AudioLines,
  FileText,
  Sparkles,
  ShieldCheck,
  Lock,
  Stethoscope,
  Users,
  LayoutDashboard,
  Mic,
  PencilLine,
  Check,
  ArrowRight,
} from 'lucide-react'
import { Brand } from '@/components/brand'

const COMO_FUNCIONA = [
  {
    icone: Mic,
    titulo: 'Grave a consulta',
    texto: 'Um toque para gravar. O áudio nunca sai do dispositivo sem necessidade.',
  },
  {
    icone: Sparkles,
    titulo: 'A IA estrutura',
    texto: 'Transcrição automática e evolução em SOAP, corrida ou prontuário UBS em segundos.',
  },
  {
    icone: PencilLine,
    titulo: 'Revise e use',
    texto: 'Você revisa, ajusta e exporta. O médico sempre tem a palavra final.',
  },
]

const RECURSOS = [
  {
    icone: AudioLines,
    titulo: 'Transcrição inteligente',
    texto: 'Consultas de qualquer duração viram texto limpo, filtrando o que não importa.',
  },
  {
    icone: FileText,
    titulo: 'Evolução assistida',
    texto: 'Evolução clínica estruturada e documentos (atestado, exames) gerados pela IA.',
  },
  {
    icone: Stethoscope,
    titulo: 'Copiloto multimodal',
    texto: 'Anexe exames e imagens e receba análise contextualizada com apoio à decisão.',
  },
  {
    icone: Users,
    titulo: 'Prontuário unificado',
    texto: 'Histórico completo do paciente, com dados clínicos e consultas vinculadas.',
  },
  {
    icone: LayoutDashboard,
    titulo: 'Painel do dia',
    texto: 'Fila de revisão, tempo economizado e produtividade num só lugar.',
  },
  {
    icone: ShieldCheck,
    titulo: 'LGPD por princípio',
    texto: 'Minimização de dados, criptografia e auditoria desde o primeiro clique.',
  },
]

const PLANOS = [
  {
    nome: 'Teste',
    preco: 'Grátis',
    periodo: '14 dias',
    descricao: 'Experimente o fluxo completo sem cartão.',
    itens: ['Transcrição e evolução por IA', 'Assistente multimodal', 'Até 30 consultas'],
    destaque: false,
    cta: 'Começar grátis',
  },
  {
    nome: 'Pro',
    preco: 'R$ 149',
    periodo: '/mês',
    descricao: 'Para o médico que atende em volume.',
    itens: [
      'Consultas ilimitadas (uso justo)',
      'Prontuário unificado',
      'Documentos e exportação',
      'Suporte prioritário',
    ],
    destaque: true,
    cta: 'Assinar Pro',
  },
  {
    nome: 'Clínica',
    preco: 'Sob consulta',
    periodo: '',
    descricao: 'Para equipes e clínicas.',
    itens: ['Vários médicos', 'Gestão de equipe', 'Integrações (PEP)', 'Onboarding dedicado'],
    destaque: false,
    cta: 'Falar com a gente',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Inteligência clínica para consultas médicas
            </span>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Transforme consultas em documentação clínica em segundos.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
              O Escriba Health grava, transcreve e estrutura a evolução médica com IA — para você
              cuidar do paciente, não da papelada.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
              >
                Começar grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Já tenho conta
              </Link>
            </div>
            <p className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> LGPD Ready
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" /> Criptografia ponta a ponta
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Como funciona</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {COMO_FUNCIONA.map((p, i) => (
              <div key={p.titulo} className="relative rounded-2xl border border-border bg-card p-6">
                <span className="absolute right-5 top-5 text-3xl font-semibold text-muted/40">
                  {i + 1}
                </span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <p.icone className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-medium">{p.titulo}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Um copiloto clínico de ponta a ponta
          </h2>
          <p className="mt-3 text-muted-foreground">
            Tudo o que o médico moderno precisa, num fluxo só — com o menor número de cliques.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r) => (
            <div
              key={r.titulo}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <r.icone className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-medium">{r.titulo}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{r.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Planos simples</h2>
            <p className="mt-3 text-muted-foreground">
              Comece grátis. Cobre só quando fizer sentido para a sua rotina.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANOS.map((plano) => (
              <div
                key={plano.nome}
                className={`flex flex-col rounded-2xl border p-6 ${
                  plano.destaque
                    ? 'border-primary bg-card shadow-lg shadow-primary/10'
                    : 'border-border bg-card'
                }`}
              >
                {plano.destaque ? (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                    Mais popular
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold">{plano.nome}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plano.descricao}</p>
                <p className="mt-4">
                  <span className="text-3xl font-semibold tracking-tight">{plano.preco}</span>
                  <span className="text-sm text-muted-foreground">{plano.periodo}</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plano.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/cadastro"
                  className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    plano.destaque
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border hover:bg-secondary'
                  }`}
                >
                  {plano.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Valores ilustrativos. Apoio à decisão clínica — não substitui o julgamento do médico.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-[#0b2a30] to-[#11514f] p-10 text-center text-white sm:p-14">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Menos papelada, mais paciente.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Junte-se aos médicos que já documentam consultas em segundos com o Escriba Health.
          </p>
          <Link
            href="/cadastro"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-[#0b2a30] transition-transform hover:scale-[1.02]"
          >
            Começar grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Brand />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Escriba Health · Inteligência clínica para consultas
            médicas
          </p>
        </div>
      </footer>
    </div>
  )
}
