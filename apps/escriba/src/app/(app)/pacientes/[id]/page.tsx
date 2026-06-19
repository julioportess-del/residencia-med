import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, Plus, FileText } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterPaciente } from '@/server/pacientes'
import { Button } from '@residencia-med/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { TIPO_CONSULTA_LABEL } from '@/lib/rotulos'
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

function ListaClinica({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground/70">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {itens.map((i) => (
            <span key={i} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
              {i}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function ProntuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await exigirUsuario()
  const p = await obterPaciente(user.id, id)
  if (!p) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Pacientes
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
            {p.nomeCompleto.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{p.nomeCompleto}</h1>
            <p className="text-sm text-muted-foreground">
              {idade(p.dataNascimento) ?? 'Idade não informada'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/pacientes/${p.id}/editar`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <ExcluirPacienteBotao pacienteId={p.id} />
        </div>
      </div>

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <Linha rotulo="CPF" valor={p.cpf} />
          <Linha rotulo="E-mail" valor={p.email} />
          <Linha rotulo="Telefone" valor={p.telefone} />
          <Linha rotulo="Endereço" valor={p.endereco} />
          {!p.cpf && !p.email && !p.telefone && !p.endereco ? (
            <p className="py-1.5 text-sm text-muted-foreground/70">
              Nenhum dado de contato informado.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Informações clínicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações clínicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListaClinica titulo="Alergias" itens={p.alergias} />
          <ListaClinica titulo="Medicamentos em uso" itens={p.medicamentos} />
          <ListaClinica titulo="Condições crônicas" itens={p.condicoesCronicas} />
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

      {/* Histórico de consultas */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Histórico de consultas</CardTitle>
          <Link href={`/consultas/nova?paciente=${p.id}`}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova consulta
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {p.consultas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma consulta vinculada a este paciente ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {p.consultas.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/consultas/${c.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:opacity-80"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {TIPO_CONSULTA_LABEL[c.tipoConsulta] ?? c.tipoConsulta}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.atualizadoEm.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
