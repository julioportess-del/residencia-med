'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  ClipboardCopy,
  FlaskConical,
  Loader2,
  Pill,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * "Analisar consulta com IA" (Clinical Copilot): hipóteses com raciocínio,
 * alertas, tratamento, exames e FONTES REAIS (PubMed/Europe PMC) em cards
 * estruturados. Apoio à decisão — nada entra no prontuário sem o médico.
 */

interface Hipotese {
  hipotese: string
  aFavor: string[]
  contra: string[]
  dadosFaltantes: string[]
}

interface Analise {
  resumoCaso: string
  hipoteses: Hipotese[]
  sinaisAlerta: string[]
  tratamento: {
    objetivo: string
    preferenciais: string[]
    alternativas: string[]
    contraindicacoesInteracoes: string[]
    monitorizacao: string[]
  }
  examesSugeridos: { exame: string; justificativa: string }[]
  pendencias: string[]
  limitacoes: string[]
}

interface AlertaSeguranca {
  tipo: string
  gravidade: 'CRITICO' | 'ATENCAO'
  mensagem: string
  origem: string
}

interface DiretrizSugerida {
  instituicao: string
  nome: string
  url: string
}

interface Fonte {
  nivel?: string
  titulo: string
  autores: string
  tipoEstudo: string
  ano: string
  pmid?: string
  doi?: string
  url: string
  consultadoEm: string
}

function Lista({ itens, classe = '' }: { itens: string[]; classe?: string }) {
  if (itens.length === 0) return null
  return (
    <ul className={`list-disc space-y-1 pl-5 text-sm text-foreground/90 ${classe}`}>
      {itens.map((i, k) => (
        <li key={k}>{i}</li>
      ))}
    </ul>
  )
}

export function AnaliseClinica({ consultaId }: { consultaId: string }) {
  const [carregando, setCarregando] = useState(false)
  const [etapa, setEtapa] = useState<'fontes' | 'analise' | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [analise, setAnalise] = useState<Analise | null>(null)
  const [fontes, setFontes] = useState<Fonte[]>([])
  const [termosBusca, setTermosBusca] = useState('')
  const [alertasSeguranca, setAlertasSeguranca] = useState<AlertaSeguranca[]>([])
  const [diretrizes, setDiretrizes] = useState<DiretrizSugerida[]>([])
  const [salvaEm, setSalvaEm] = useState<string | null>(null)
  const [filtroNivel, setFiltroNivel] = useState<string>('TODOS')
  const [copiado, setCopiado] = useState(false)

  async function analisar(forcar = false) {
    setCarregando(true)
    setErro(null)
    try {
      // Etapa 1: evidências + segurança (rápida) — etapa 2 fica com o tempo
      // inteiro do servidor só para a geração da análise.
      setEtapa('fontes')
      const prepResp = await fetch(`/api/consultas/${consultaId}/analisar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: 'preparar', forcar }),
      })
      const prep = (await prepResp.json().catch(() => null)) as
        | (
            | {
                ok: true
                fontes: Fonte[]
                termosBusca: string
                alertasSeguranca?: AlertaSeguranca[]
                diretrizesSugeridas?: DiretrizSugerida[]
                analisePronta?: boolean
                analise?: Analise
                salvaEm?: string
              }
            | { ok: false; erro: string }
          )
        | null
      if (!prepResp.ok || !prep || prep.ok === false) {
        setErro((prep && 'erro' in prep && prep.erro) || 'Falha ao buscar evidências.')
        return
      }
      setDiretrizes(prep.diretrizesSugeridas ?? [])

      // Análise já salva desta mesma transcrição → mostra na hora, sem custo.
      if (prep.analisePronta && prep.analise) {
        setAnalise(prep.analise)
        setFontes(prep.fontes ?? [])
        setTermosBusca(prep.termosBusca ?? '')
        setAlertasSeguranca(prep.alertasSeguranca ?? [])
        setSalvaEm(prep.salvaEm ?? null)
        return
      }

      setEtapa('analise')
      const resp = await fetch(`/api/consultas/${consultaId}/analisar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etapa: 'gerar',
          fontes: prep.fontes,
          termosBusca: prep.termosBusca,
          forcar,
        }),
      })
      const dados = (await resp.json().catch(() => null)) as
        | (
            | {
                ok: true
                analise: Analise
                fontes: Fonte[]
                termosBusca?: string
                alertasSeguranca?: AlertaSeguranca[]
              }
            | { ok: false; erro: string }
          )
        | null
      if (!resp.ok || !dados || dados.ok === false) {
        setErro((dados && 'erro' in dados && dados.erro) || 'Falha ao analisar. Tente novamente.')
        return
      }
      setAnalise(dados.analise)
      setFontes(dados.fontes)
      setTermosBusca(dados.termosBusca ?? '')
      setAlertasSeguranca(dados.alertasSeguranca ?? [])
      setSalvaEm(null)
    } catch {
      setErro('Falha de rede. Tente novamente.')
    } finally {
      setCarregando(false)
      setEtapa(null)
    }
  }

  function textoParaCopiar(): string {
    if (!analise) return ''
    const h = analise.hipoteses
      .map(
        (x) =>
          `- ${x.hipotese}\n  A favor: ${x.aFavor.join('; ') || '—'}\n  Contra: ${
            x.contra.join('; ') || '—'
          }\n  Faltam: ${x.dadosFaltantes.join('; ') || '—'}`,
      )
      .join('\n')
    const refs = fontes
      .map((f, i) => `[${i + 1}] ${f.titulo} (${f.ano}) ${f.pmid ? `PMID ${f.pmid}` : ''} ${f.url}`)
      .join('\n')
    return [
      `ANÁLISE CLÍNICA (apoio à decisão — IA)`,
      analise.resumoCaso && `Resumo: ${analise.resumoCaso}`,
      h && `HIPÓTESES:\n${h}`,
      analise.sinaisAlerta.length && `SINAIS DE ALERTA:\n- ${analise.sinaisAlerta.join('\n- ')}`,
      analise.tratamento.objetivo && `TRATAMENTO — objetivo: ${analise.tratamento.objetivo}`,
      analise.tratamento.preferenciais.length &&
        `Preferenciais:\n- ${analise.tratamento.preferenciais.join('\n- ')}`,
      analise.examesSugeridos.length &&
        `EXAMES:\n- ${analise.examesSugeridos.map((e) => `${e.exame}: ${e.justificativa}`).join('\n- ')}`,
      analise.pendencias.length && `PENDÊNCIAS:\n- ${analise.pendencias.join('\n- ')}`,
      refs && `REFERÊNCIAS:\n${refs}`,
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  async function copiar() {
    await navigator.clipboard.writeText(textoParaCopiar())
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Análise clínica com IA
        </CardTitle>
        {analise ? (
          <Button size="sm" variant="outline" onClick={copiar}>
            {copiado ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copiado ? 'Copiado' : 'Copiar'}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {!analise ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Hipóteses com raciocínio, sinais de alerta, sugestão de tratamento e exames —
              fundamentados em evidências reais (PubMed/Europe PMC), com as fontes listadas. Apoio à
              decisão: a conduta final é sua.
            </p>
            <Button onClick={() => analisar(false)} loading={carregando} disabled={carregando}>
              <Sparkles className="h-4 w-4" />
              {carregando
                ? 'Analisando (busca de evidências + análise)…'
                : 'Analisar consulta com IA'}
            </Button>
            {carregando ? (
              <p className="text-xs text-muted-foreground">
                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                {etapa === 'fontes'
                  ? 'Etapa 1/2: buscando evidências reais e verificando segurança…'
                  : 'Etapa 2/2: gerando hipóteses, tratamento e exames — até ~50s.'}
              </p>
            ) : null}
            {erro ? (
              <p role="alert" className="text-sm text-destructive">
                {erro}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            {analise.resumoCaso ? (
              <p className="text-sm text-foreground/90">{analise.resumoCaso}</p>
            ) : null}

            {alertasSeguranca.length > 0 ? (
              <div className="space-y-1.5">
                {alertasSeguranca.map((a, i) => (
                  <div
                    key={i}
                    className={
                      a.gravidade === 'CRITICO'
                        ? 'rounded-lg border border-destructive bg-destructive/10 p-3'
                        : 'rounded-lg border border-amber-500/40 bg-amber-500/10 p-3'
                    }
                  >
                    <p
                      className={
                        a.gravidade === 'CRITICO'
                          ? 'flex items-center gap-1.5 text-sm font-semibold text-destructive'
                          : 'flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400'
                      }
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Segurança: {a.gravidade === 'CRITICO' ? 'crítico' : 'atenção'}
                    </p>
                    <p className="mt-0.5 text-sm text-foreground/90">{a.mensagem}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Origem: {a.origem}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {analise.sinaisAlerta.length > 0 ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Sinais de alerta
                </p>
                <Lista itens={analise.sinaisAlerta} />
              </div>
            ) : null}

            {analise.hipoteses.length > 0 ? (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Hipóteses e raciocínio (sugestões da IA)
                </p>
                {analise.hipoteses.map((h, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{h.hipotese}</p>
                    <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                      <div>
                        <p className="mb-1 font-semibold text-success">A favor</p>
                        <Lista itens={h.aFavor} classe="text-xs" />
                      </div>
                      <div>
                        <p className="mb-1 font-semibold text-destructive">Contra</p>
                        <Lista itens={h.contra} classe="text-xs" />
                      </div>
                      <div>
                        <p className="mb-1 font-semibold text-muted-foreground">Dados faltantes</p>
                        <Lista itens={h.dadosFaltantes} classe="text-xs" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {analise.tratamento.preferenciais.length > 0 || analise.tratamento.objetivo ? (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Pill className="h-4 w-4 text-primary" />
                  Sugestão de tratamento
                </p>
                {analise.tratamento.objetivo ? (
                  <p className="text-sm text-foreground/90">
                    <span className="font-medium">Objetivo:</span> {analise.tratamento.objetivo}
                  </p>
                ) : null}
                <Lista itens={analise.tratamento.preferenciais} />
                {analise.tratamento.alternativas.length > 0 ? (
                  <>
                    <p className="text-xs font-semibold text-muted-foreground">Alternativas</p>
                    <Lista itens={analise.tratamento.alternativas} classe="text-xs" />
                  </>
                ) : null}
                {analise.tratamento.contraindicacoesInteracoes.length > 0 ? (
                  <>
                    <p className="text-xs font-semibold text-destructive">
                      Contraindicações / interações a conferir
                    </p>
                    <Lista itens={analise.tratamento.contraindicacoesInteracoes} classe="text-xs" />
                  </>
                ) : null}
                {analise.tratamento.monitorizacao.length > 0 ? (
                  <>
                    <p className="text-xs font-semibold text-muted-foreground">Monitorização</p>
                    <Lista itens={analise.tratamento.monitorizacao} classe="text-xs" />
                  </>
                ) : null}
              </div>
            ) : null}

            {analise.examesSugeridos.length > 0 ? (
              <div className="space-y-1.5 rounded-lg border border-border p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  Exames sugeridos (com justificativa)
                </p>
                <ul className="space-y-1 text-sm text-foreground/90">
                  {analise.examesSugeridos.map((e, i) => (
                    <li key={i}>
                      <span className="font-medium">{e.exame}</span>
                      {e.justificativa ? ` — ${e.justificativa}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {analise.pendencias.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Pendências antes de fechar conduta
                </p>
                <Lista itens={analise.pendencias} />
              </div>
            ) : null}

            {analise.limitacoes.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Limitações: {analise.limitacoes.join(' · ')}
              </p>
            ) : null}

            <div className="space-y-1.5 border-t border-border pt-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <BookOpenCheck className="h-4 w-4 text-primary" />
                Fontes consultadas{' '}
                <span className="font-normal text-muted-foreground">
                  (PubMed/Europe PMC — reais e verificáveis)
                </span>
              </p>
              {fontes.length > 1 ? (
                <div className="flex flex-wrap gap-1.5">
                  {['TODOS', 'DIRETRIZ', 'REVISAO_SISTEMATICA', 'ENSAIO_CLINICO'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFiltroNivel(n)}
                      className={
                        filtroNivel === n
                          ? 'rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground'
                          : 'rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40'
                      }
                    >
                      {n === 'TODOS'
                        ? 'Todas'
                        : n === 'REVISAO_SISTEMATICA'
                          ? 'Revisões'
                          : n === 'ENSAIO_CLINICO'
                            ? 'Ensaios'
                            : 'Diretrizes'}
                    </button>
                  ))}
                </div>
              ) : null}
              {fontes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma fonte recuperada nesta análise — fundamentada apenas em raciocínio
                  clínico, a validar.
                </p>
              ) : (
                <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                  {fontes
                    .map((f, i) => ({ f, i }))
                    .filter(({ f }) => filtroNivel === 'TODOS' || f.nivel === filtroNivel)
                    .map(({ f, i }) => (
                      <li key={i}>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {f.titulo}
                        </a>{' '}
                        — {f.autores} ({f.ano}; {f.tipoEstudo}
                        {f.pmid ? `; PMID ${f.pmid}` : ''})
                        {f.nivel ? (
                          <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            {f.nivel.replace('_', ' ').toLowerCase()}
                          </span>
                        ) : null}
                      </li>
                    ))}
                </ol>
              )}
              {termosBusca ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Consultar também:</span>
                  <a
                    href={`https://www.uptodate.com/contents/search?search=${encodeURIComponent(termosBusca)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-primary hover:border-primary/50"
                  >
                    UpToDate ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(termosBusca)
                      window.open('https://www.openevidence.com/', '_blank', 'noopener')
                    }}
                    className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-primary hover:border-primary/50"
                    title="Abre o OpenEvidence com os termos copiados para colar"
                  >
                    OpenEvidence ↗ (termos copiados)
                  </button>
                </div>
              ) : null}
              {diretrizes.length > 0 ? (
                <div className="space-y-1 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Diretrizes oficiais para este tema (consulta manual):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {diretrizes.map((d) => (
                      <a
                        key={d.url}
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={d.nome}
                        className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-primary hover:border-primary/50"
                      >
                        {d.instituicao} ↗
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => analisar(true)}
                loading={carregando}
              >
                Regenerar
              </Button>
              {salvaEm ? (
                <p className="self-center text-xs text-muted-foreground">
                  Análise salva em {new Date(salvaEm).toLocaleString('pt-BR')}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Conteúdo gerado por IA como apoio à decisão (CFM 2.454/2026): revise antes de usar — a
              conduta final é do médico.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
