import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { prismaClinico } from '@residencia-med/db-clinico'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import {
  estruturaClinicaSchema,
  documentosDisponiveis,
  type TipoDocumento,
} from '@residencia-med/ai/clinico'
import { TIPO_CONSULTA_LABEL, STATUS_CONSULTA_LABEL } from '@/lib/rotulos'
import { type EvolucaoItem } from './_components/evolucoes-viewer'
import { ConsultaConteudo } from './_components/consulta-conteudo'
import { ProcessandoPoll } from './_components/processando-poll'
import { ReestruturarBotao } from './_components/reestruturar-botao'
import { ConsultaAnexos, type AnexoHistorico } from './_components/consulta-anexos'
import { AnaliseClinica } from './_components/analise-clinica'

export const dynamic = 'force-dynamic'

type Modelo = 'SOAP' | 'CORRIDA' | 'UBS'

export default async function ConsultaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await exigirUsuario()

  // Consulta e anexos em paralelo (ambos filtrados por tenant) — menos latência.
  const [consulta, anexosConsulta] = await Promise.all([
    prismaClinico.consulta.findFirst({
      where: { id, usuarioAuthId: user.id, excluidoEm: null },
      include: {
        evolucoes: {
          select: {
            id: true,
            modelo: true,
            textoGerado: true,
            textoEditado: true,
            dadosEstruturados: true,
          },
        },
        transcricao: { select: { id: true, texto: true } },
      },
    }),
    prismaClinico.anexo.findMany({
      where: { consultaId: id, usuarioAuthId: user.id, excluidoEm: null },
      orderBy: { criadoEm: 'desc' },
      select: { id: true, nomeArquivo: true, tipoMime: true, status: true, resumoAnalise: true },
    }),
  ])
  if (!consulta) notFound()
  if (consulta.status === 'GRAVANDO') redirect(`/consultas/${consulta.id}/gravar`)

  const processando = consulta.status === 'TRANSCREVENDO' || consulta.status === 'ESTRUTURANDO'
  const temTranscricao = Boolean(consulta.transcricao)
  const evolucoes: EvolucaoItem[] = consulta.evolucoes.map((e) => ({
    id: e.id,
    modelo: e.modelo as Modelo,
    textoGerado: e.textoGerado,
    textoEditado: e.textoEditado,
  }))

  // Documentos derivados disponíveis a partir da estrutura clínica persistida.
  const estruturaParse = estruturaClinicaSchema.safeParse(
    consulta.evolucoes.find((e) => e.dadosEstruturados)?.dadosEstruturados,
  )
  const docsDisponiveis: TipoDocumento[] = estruturaParse.success
    ? documentosDisponiveis(estruturaParse.data)
    : []
  const estrutura = estruturaParse.success ? estruturaParse.data : null

  const anexosIniciais: AnexoHistorico[] = anexosConsulta.map((a) => ({
    id: a.id,
    nomeArquivo: a.nomeArquivo,
    tipoMime: a.tipoMime,
    status: a.status,
    resumoAnalise: a.resumoAnalise,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/consultas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            {consulta.pacienteIniciais} ·{' '}
            {TIPO_CONSULTA_LABEL[consulta.tipoConsulta] ?? consulta.tipoConsulta}
          </CardTitle>
          <StatusBadge status={consulta.status} />
        </CardHeader>
        <CardContent>
          {processando ? (
            <ProcessandoPoll
              rotulo={STATUS_CONSULTA_LABEL[consulta.status] ?? 'Processando'}
              consultaId={consulta.id}
            />
          ) : evolucoes.length > 0 ? (
            <ConsultaConteudo
              consultaId={consulta.id}
              evolucoes={evolucoes}
              revisado={consulta.status === 'REVISADO'}
              documentosDisponiveis={docsDisponiveis}
              estrutura={estrutura}
            />
          ) : temTranscricao ? (
            <ReestruturarBotao
              consultaId={consulta.id}
              mensagem="A evolução ainda não foi gerada (a anterior pode ter expirado). A transcrição está salva — gere novamente."
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma evolução foi gerada. Volte e grave novamente a consulta.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exames e imagens</CardTitle>
        </CardHeader>
        <CardContent>
          <ConsultaAnexos consultaId={consulta.id} anexosIniciais={anexosIniciais} />
        </CardContent>
      </Card>

      {consulta.transcricao?.texto ? (
        <Card>
          <CardContent className="pt-6">
            {/* Conferência do que foi captado — essencial p/ diagnosticar
                gravações mudas (ex.: teleconsulta sem áudio da chamada). */}
            <details>
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Ver transcrição da consulta (
                {consulta.transcricao.texto.length.toLocaleString('pt-BR')} caracteres)
              </summary>
              <pre className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                {consulta.transcricao.texto}
              </pre>
            </details>
          </CardContent>
        </Card>
      ) : null}

      {consulta.transcricao?.texto ? <AnaliseClinica consultaId={consulta.id} /> : null}
    </div>
  )
}
