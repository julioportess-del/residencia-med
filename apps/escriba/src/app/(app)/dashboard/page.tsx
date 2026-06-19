import Link from 'next/link'
import {
  Stethoscope,
  ClipboardCheck,
  Clock,
  FileText,
  Sparkles,
  BarChart3,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterMetricas, formatarDuracao } from '@/server/metricas'
import { obterResumoDashboard } from '@/server/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@residencia-med/ui'
import { TIPO_CONSULTA_LABEL } from '@/lib/rotulos'

export const dynamic = 'force-dynamic'

function saudacaoEData(): { saudacao: string; data: string } {
  const agora = new Date()
  const hora = Number(
    agora.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hour12: false,
    }),
  )
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const data = agora.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return { saudacao, data }
}

interface KpiProps {
  icone: React.ReactNode
  valor: string
  rotulo: string
  detalhe?: string
  destaque?: boolean
}

function Kpi({ icone, valor, rotulo, detalhe, destaque }: KpiProps) {
  return (
    <Card className={destaque ? 'border-primary/40 bg-primary/[0.04]' : undefined}>
      <CardContent className="flex flex-col gap-1.5 p-5">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
            destaque ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
          }`}
        >
          {icone}
        </span>
        <p className="text-2xl font-semibold tracking-tight">{valor}</p>
        <p className="text-sm text-muted-foreground">{rotulo}</p>
        {detalhe ? <p className="text-xs text-muted-foreground">{detalhe}</p> : null}
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const user = await exigirUsuario()
  const primeiroNome =
    (
      (user.user_metadata?.name as string | undefined) ??
      user.email.split('@')[0] ??
      'Doutor(a)'
    ).split(' ')[0] ?? 'Doutor(a)'

  const [m, resumo] = await Promise.all([obterMetricas(user.id), obterResumoDashboard(user.id)])
  const { saudacao, data } = saudacaoEData()

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {saudacao}, {primeiroNome}.
        </h1>
        <p className="text-sm capitalize text-muted-foreground">{data}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icone={<Stethoscope className="h-5 w-5" />}
          valor={String(resumo.consultasHoje)}
          rotulo="Consultas hoje"
        />
        <Kpi
          icone={<ClipboardCheck className="h-5 w-5" />}
          valor={String(resumo.pendentesRevisao)}
          rotulo="Pendentes de revisão"
          destaque={resumo.pendentesRevisao > 0}
        />
        <Kpi
          icone={<Clock className="h-5 w-5" />}
          valor={formatarDuracao(m.minutosEconomizados)}
          rotulo="Tempo economizado"
          detalhe={`${formatarDuracao(m.minutosEconomizadosMes)} neste mês`}
        />
        <Kpi
          icone={<FileText className="h-5 w-5" />}
          valor={String(m.consultasProcessadas)}
          rotulo="Evoluções geradas"
          detalhe={`${m.documentosGerados} documentos`}
        />
      </div>

      {/* Fila de revisão */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Fila de revisão</CardTitle>
          <Link
            href="/consultas"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver consultas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {resumo.filaRevisao.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma evolução aguardando revisão. Tudo em dia. ✨
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {resumo.filaRevisao.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.pacienteIniciais} ·{' '}
                      <span className="font-normal text-muted-foreground">
                        {TIPO_CONSULTA_LABEL[c.tipoConsulta] ?? c.tipoConsulta}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Atualizada{' '}
                      {c.atualizadoEm.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Link href={`/consultas/${c.id}`}>
                    <Button size="sm" variant="outline">
                      Revisar
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Ações rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <AcaoRapida
            href="/consultas/nova"
            icone={<Plus className="h-5 w-5" />}
            titulo="Nova consulta"
          />
          <AcaoRapida
            href="/assistente"
            icone={<Sparkles className="h-5 w-5" />}
            titulo="Assistente"
          />
          <AcaoRapida
            href="/metricas"
            icone={<BarChart3 className="h-5 w-5" />}
            titulo="Métricas"
          />
        </div>
      </div>

      {/* CTA flutuante */}
      <Link
        href="/consultas/nova"
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.03] lg:bottom-8 lg:right-8"
      >
        <Plus className="h-4 w-4" />
        Iniciar consulta
      </Link>
    </div>
  )
}

function AcaoRapida({
  href,
  icone,
  titulo,
}: {
  href: string
  icone: React.ReactNode
  titulo: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icone}
      </span>
      <span className="text-sm font-medium">{titulo}</span>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
