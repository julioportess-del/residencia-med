import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, Plus, AlarmClock, History, Pill, Stethoscope } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterPaciente } from '@/server/pacientes'
import { resumoUltimaConsulta } from '@/server/retorno'
import { Button } from '@residencia-med/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { TIPO_ATENDIMENTO_LABEL, TIPO_CONSULTA_LABEL } from '@/lib/rotulos'
import { ExcluirPacienteBotao } from './_components/excluir-paciente-botao'

export const dynamic = 'force-dynamic'

function idade(nascimento: Date | null): string | null {
  if (!nascimento) return null
  const hoje = new Date()
  let anos = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) anos--
  return `${anos} anos`
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right font-medium">{valor}</span>
    </div>
  )
}

function Chips({ itens }: { itens: string[] }) {
  if (itens.length === 0) return <p className="text-sm text-muted-foreground/70">—</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {itens.map((i) => (
        <span key={i} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
          {i}
        </span>
      ))}
    </div>
  )
}

function BlocoLongitudinal({
  titulo,
  icone,
  children,
}: {
  titulo: string
  icone: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icone}
        {titulo}
      </p>
      {children}
    </div>
  )
}

/** Une listas removendo duplicatas (case-insensitive), preservando a ordem. */
function unirSemDuplicar(...listas: string[][]): string[] {
  const vistos = new Set<string>()
  const resultado: string[] = []
  for (const item of listas.flat()) {
    const chave = item.trim().toLowerCase()
    if (!chave || vistos.has(chave)) continue
    vistos.add(chave)
    resultado.push(item.trim())
  }
  return resultado
}

export default async function ProntuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await exigirUsuario()
  const p = await obterPaciente(user.id, id)
  if (!p) notFound()

  // Visão longitudinal: última consulta concluída (estrutura já persistida).
  const ultima = await resumoUltimaConsulta(user.id, p.id)

  const diagnosticosAtivos = unirSemDuplicar(p.condicoesCronicas, ultima?.diagnosticos ?? [])
  const medicamentosAtuais = unirSemDuplicar(p.medicamentos, ultima?.medicamentos ?? [])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Pacientes
      </Link>

      {/* Header + ação principal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
            {p.nomeCompleto.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{p.nomeCompleto}</h1>
            <p className="text-sm text-muted-foreground">
              {idade(p.dataNascimento) ?? 'Idade não informada'}
              {p.alergias.length > 0 ? (
                <span className="text-destructive"> · Alergias: {p.alergias.join(', ')}</span>
              ) : null}
            </p>
          </div>
        </div>
        <Link href={`/consultas/nova?paciente=${p.id}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova consulta deste paciente
          </Button>
        </Link>
      </div>

      {/* Resumo longitudinal */}
      <div className="grid gap-3 sm:grid-cols-2">
        <BlocoLongitudinal titulo="Última consulta" icone={<History className="h-3.5 w-3.5" />}>
          {ultima ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {new Date(ultima.dataConsulta).toLocaleDateString('pt-BR')}
              </p>
              {ultima.conduta ? (
                <p className="text-muted-foreground">{ultima.conduta.slice(0, 200)}</p>
              ) : null}
              <Link
                href={`/consultas/${ultima.consultaId}`}
                className="inline-block text-xs text-primary hover:underline"
              >
                Ver consulta
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/70">Nenhuma consulta concluída ainda.</p>
          )}
        </BlocoLongitudinal>

        <BlocoLongitudinal
          titulo="Diagnósticos ativos"
          icone={<Stethoscope className="h-3.5 w-3.5" />}
        >
          <Chips itens={diagnosticosAtivos} />
        </BlocoLongitudinal>

        <BlocoLongitudinal titulo="Medicamentos atuais" icone={<Pill className="h-3.5 w-3.5" />}>
          <Chips itens={medicamentosAtuais} />
        </BlocoLongitudinal>

        <BlocoLongitudinal titulo="Pendências" icone={<AlarmClock className="h-3.5 w-3.5" />}>
          {ultima && ultima.pendencias.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {ultima.pendencias.map((pend) => (
                <li key={pend} className="text-muted-foreground">
                  • {pend}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground/70">Nenhuma pendência registrada.</p>
          )}
        </BlocoLongitudinal>
      </div>

      {ultima && ultima.exames.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exames recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {ultima.exames.map((e) => (
                <li key={e} className="text-muted-foreground">
                  • {e}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Linha do tempo de consultas */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Linha do tempo</CardTitle>
          <span className="text-sm text-muted-foreground">
            {p.consultas.length} {p.consultas.length === 1 ? 'consulta' : 'consultas'}
          </span>
        </CardHeader>
        <CardContent>
          {p.consultas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma consulta vinculada a este paciente ainda.
            </p>
          ) : (
            <ol className="relative space-y-0 border-l border-border pl-5">
              {p.consultas.map((c) => (
                <li key={c.id} className="relative pb-4 last:pb-0">
                  <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary/60" />
                  <Link
                    href={`/consultas/${c.id}`}
                    className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        {TIPO_ATENDIMENTO_LABEL[c.tipoAtendimento] ?? 'Consulta'}
                        <span className="font-normal text-muted-foreground">
                          {' · '}
                          {c.atualizadoEm.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.resumo ?? TIPO_CONSULTA_LABEL[c.tipoConsulta] ?? c.tipoConsulta}
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Dados pessoais + cadastro (secundário) */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Cadastro</CardTitle>
          <div className="flex items-center gap-2">
            <Link href={`/pacientes/${p.id}/editar`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            <ExcluirPacienteBotao pacienteId={p.id} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-border">
            <Linha rotulo="CPF" valor={p.cpf} />
            <Linha rotulo="E-mail" valor={p.email} />
            <Linha rotulo="Telefone" valor={p.telefone} />
            <Linha rotulo="Endereço" valor={p.endereco} />
          </div>
          {p.antecedentes ? (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Antecedentes familiares
              </p>
              <p className="whitespace-pre-wrap text-sm">{p.antecedentes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
