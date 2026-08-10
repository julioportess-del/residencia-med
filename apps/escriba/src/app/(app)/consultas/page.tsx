import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileAudio, Plus } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { listarConsultas } from '@/server/consultas'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { TIPO_CONSULTA_LABEL } from '@/lib/rotulos'
import { ExcluirConsultaBotao } from '@/components/excluir-consulta-botao'

export const dynamic = 'force-dynamic'

export default async function ConsultasPage() {
  const user = await exigirUsuario()
  const consultas = await listarConsultas(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Consultas</h1>
          <p className="text-sm text-muted-foreground">
            Grave, transcreva e gere a evolução para revisar antes do prontuário.
          </p>
        </div>
        <Link
          href="/consultas/nova"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-4 w-4" />
          Nova consulta
        </Link>
      </div>

      {consultas.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <FileAudio className="h-6 w-6" />
          </span>
          <div>
            <p className="font-medium">Nenhuma consulta ainda</p>
            <p className="text-sm text-muted-foreground">
              Comece uma nova consulta para gerar seu primeiro rascunho de evolução.
            </p>
          </div>
          <Link
            href="/consultas/nova"
            className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova consulta
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {consultas.map((c) => (
            <li key={c.id}>
              <Card className="flex items-center gap-2 p-4 transition-colors hover:bg-accent/50">
                <Link
                  href={`/consultas/${c.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {c.pacienteIniciais} ·{' '}
                      <span className="text-muted-foreground">
                        {TIPO_CONSULTA_LABEL[c.tipoConsulta] ?? c.tipoConsulta}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(c.criadoEm, "d 'de' MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
                <ExcluirConsultaBotao consultaId={c.id} rotulo={c.pacienteIniciais} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
