import Link from 'next/link'
import { UserPlus, Users, ArrowRight, Settings2 } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterPreferencias } from '@/server/preferencias'
import { listarPacientes } from '@/server/pacientes'
import { Button } from '@residencia-med/ui'
import { Card, CardContent } from '@/components/ui/card'
import { BuscaInput } from './_components/busca-input'

export const dynamic = 'force-dynamic'

function idade(nascimento: Date | null): string | null {
  if (!nascimento) return null
  const hoje = new Date()
  let anos = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) anos--
  return `${anos} anos`
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await exigirUsuario()
  const pref = await obterPreferencias(user.id)

  // Opt-in inativo → CTA de ativação (sem buscar dados de paciente).
  if (!pref.cadastroPacientesAtivo) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Users className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">Cadastro de pacientes</h1>
        <p className="text-sm text-muted-foreground">
          Ative o cadastro de pacientes para manter um prontuário unificado com dados, histórico
          clínico e consultas vinculadas. Como envolve dado identificável, é opcional e exige seu
          aceite dos termos.
        </p>
        <Link href="/preferencias">
          <Button>
            <Settings2 className="mr-2 h-4 w-4" />
            Ativar nas Preferências
          </Button>
        </Link>
      </div>
    )
  }

  const { q } = await searchParams
  const pacientes = await listarPacientes(user.id, q)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Prontuário unificado dos seus pacientes.</p>
        </div>
        <Link href="/pacientes/novo">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo paciente
          </Button>
        </Link>
      </div>

      <BuscaInput inicial={q ?? ''} />

      {pacientes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {q
              ? 'Nenhum paciente encontrado para essa busca.'
              : 'Nenhum paciente cadastrado ainda.'}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {pacientes.map((p) => (
            <li key={p.id}>
              <Link
                href={`/pacientes/${p.id}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                  {p.nomeCompleto.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.nomeCompleto}</p>
                  <p className="text-xs text-muted-foreground">
                    {[idade(p.dataNascimento), p.telefone, `${p.totalConsultas} consulta(s)`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
