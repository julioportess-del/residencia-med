import { Clock, FileCheck2, FileText, Stethoscope } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterMetricas, formatarDuracao } from '@/server/metricas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TIPO_CONSULTA_LABEL } from '@/lib/rotulos'

export const dynamic = 'force-dynamic'

interface IndicadorProps {
  icone: React.ReactNode
  valor: string
  rotulo: string
  detalhe?: string
}

function Indicador({ icone, valor, rotulo, detalhe }: IndicadorProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {icone}
        </span>
        <p className="text-2xl font-semibold tracking-tight">{valor}</p>
        <p className="text-sm text-muted-foreground">{rotulo}</p>
        {detalhe ? <p className="text-xs text-muted-foreground">{detalhe}</p> : null}
      </CardContent>
    </Card>
  )
}

export default async function MetricasPage() {
  const user = await exigirUsuario()
  const m = await obterMetricas(user.id)

  const taxaRevisao =
    m.consultasProcessadas > 0
      ? Math.round((m.consultasRevisadas / m.consultasProcessadas) * 100)
      : 0
  const maxTipo = m.porTipo[0]?.total ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Métricas</h1>
        <p className="text-sm text-muted-foreground">
          Sua produtividade no Escriba. Tempo economizado é uma estimativa conservadora de digitação
          de prontuário poupada (8 min por consulta processada).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Indicador
          icone={<Clock className="h-5 w-5" />}
          valor={formatarDuracao(m.minutosEconomizados)}
          rotulo="Tempo economizado"
          detalhe={`${formatarDuracao(m.minutosEconomizadosMes)} neste mês`}
        />
        <Indicador
          icone={<Stethoscope className="h-5 w-5" />}
          valor={String(m.consultasProcessadas)}
          rotulo="Consultas processadas"
          detalhe={`${m.consultasProcessadasMes} neste mês · ${m.totalConsultas} no total`}
        />
        <Indicador
          icone={<FileCheck2 className="h-5 w-5" />}
          valor={`${taxaRevisao}%`}
          rotulo="Taxa de revisão"
          detalhe={`${m.consultasRevisadas} revisadas pelo médico`}
        />
        <Indicador
          icone={<FileText className="h-5 w-5" />}
          valor={String(m.documentosGerados)}
          rotulo="Documentos gerados"
          detalhe="Atestados, receitas, exames…"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consultas por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {m.porTipo.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta processada ainda. Grave e gere uma evolução para começar a ver suas
              métricas.
            </p>
          ) : (
            <ul className="space-y-3">
              {m.porTipo.map((t) => (
                <li key={t.tipo} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-sm">
                    {TIPO_CONSULTA_LABEL[t.tipo] ?? t.tipo}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${maxTipo > 0 ? (t.total / maxTipo) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    {t.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
