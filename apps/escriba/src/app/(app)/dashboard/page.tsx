import Link from 'next/link'
import { Clock, FileText, Mic, Plus, ArrowRight, Users } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterMetricas, formatarDuracao } from '@/server/metricas'
import { obterResumoDashboard, type ItemConsultaResumo } from '@/server/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@residencia-med/ui'
import { StatusBadge } from '@/components/status-badge'
import { ExcluirConsultaBotao } from '@/components/excluir-consulta-botao'
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

function horaCurta(d: Date): string {
  return d.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Consulta em GRAVANDO volta para a tela de gravação; demais vão ao detalhe. */
function destinoConsulta(c: ItemConsultaResumo): string {
  return c.status === 'GRAVANDO' ? `/consultas/${c.id}/gravar` : `/consultas/${c.id}`
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
    <div className="space-y-6 pb-24">
      {/* Saudação + ação principal */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {saudacao}, {primeiroNome}.
          </h1>
          <p className="text-sm capitalize text-muted-foreground">{data}</p>
        </div>
        <Link href="/consultas/nova">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova consulta
          </Button>
        </Link>
      </div>

      {/* Continuar atendimento em andamento */}
      {resumo.emAndamento.length > 0 ? (
        <Card className="border-primary/40 bg-primary/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mic className="h-4 w-4 text-primary" />
              Continuar atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {resumo.emAndamento.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.pacienteIniciais}{' '}
                      <span className="font-normal text-muted-foreground">
                        · {TIPO_CONSULTA_LABEL[c.tipoConsulta] ?? c.tipoConsulta}
                      </span>
                    </p>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link href={destinoConsulta(c)}>
                      <Button size="sm">Continuar</Button>
                    </Link>
                    <ExcluirConsultaBotao consultaId={c.id} rotulo={c.pacienteIniciais} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Consultas de hoje + Fila de revisão */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Consultas de hoje</CardTitle>
            <span className="text-sm text-muted-foreground">{resumo.consultasHoje.length}</span>
          </CardHeader>
          <CardContent>
            {resumo.consultasHoje.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma consulta hoje ainda.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {resumo.consultasHoje.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link
                      href={destinoConsulta(c)}
                      className="min-w-0 flex-1 transition-colors hover:text-primary"
                    >
                      <p className="truncate text-sm font-medium">{c.pacienteIniciais}</p>
                      <p className="text-xs text-muted-foreground">
                        {horaCurta(c.atualizadoEm)} ·{' '}
                        {TIPO_CONSULTA_LABEL[c.tipoConsulta] ?? c.tipoConsulta}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={c.status} />
                      <ExcluirConsultaBotao consultaId={c.id} rotulo={c.pacienteIniciais} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className={resumo.pendentesRevisao > 0 ? 'border-primary/30' : undefined}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Prontuários a revisar</CardTitle>
            <Link
              href="/consultas"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {resumo.filaRevisao.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Tudo em dia. Nenhum prontuário aguardando revisão. ✨
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {resumo.filaRevisao.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.pacienteIniciais}</p>
                      <p className="text-xs text-muted-foreground">
                        {TIPO_CONSULTA_LABEL[c.tipoConsulta] ?? c.tipoConsulta}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/consultas/${c.id}`}>
                        <Button size="sm" variant="outline">
                          Revisar
                        </Button>
                      </Link>
                      <ExcluirConsultaBotao consultaId={c.id} rotulo={c.pacienteIniciais} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pacientes recentes */}
      {resumo.pacientesRecentes.length > 0 ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" />
              Pacientes recentes
            </CardTitle>
            <Link
              href="/pacientes"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {resumo.pacientesRecentes.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/pacientes/${p.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <span className="truncate font-medium">{p.nomeCompleto}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Métricas — posição secundária, discreta */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {formatarDuracao(m.minutosEconomizados)} economizados
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          {m.consultasProcessadas} evoluções · {m.documentosGerados} documentos
        </span>
        <Link
          href="/metricas"
          className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
        >
          Métricas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* CTA flutuante (mantido — 1 clique de qualquer scroll) */}
      <Link
        href="/consultas/nova"
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.03] lg:hidden"
      >
        <Plus className="h-4 w-4" />
        Iniciar consulta
      </Link>
    </div>
  )
}
