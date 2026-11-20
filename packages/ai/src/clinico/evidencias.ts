import { chaveCacheLLM, getCache, setCache } from '../cache'

/**
 * Escriba Evidence Engine — conectores de bases científicas REAIS.
 *
 * v1: PubMed (NCBI E-utilities) + Europe PMC, ambas APIs públicas e
 * documentadas, sem chave obrigatória (PubMed: até 3 req/s sem key).
 * Arquitetura extensível: cada fonte implementa `ConectorEvidencia`;
 * novas fontes (Cochrane, NICE, PCDT...) entram como novos conectores.
 *
 * Regras invioláveis:
 * - NUNCA inventar referência: toda Evidencia nasce de metadados retornados
 *   pela API oficial, com URL canônica e data de consulta.
 * - LGPD: as buscas recebem SOMENTE termos clínicos desidentificados —
 *   nunca nome, CPF ou qualquer dado do paciente.
 * - Falha de fonte não derruba o fluxo: retorna lista vazia e o chamador
 *   informa a limitação explicitamente.
 */

export interface Evidencia {
  fonte: 'PUBMED' | 'EUROPE_PMC'
  titulo: string
  autores: string
  tipoEstudo: string
  ano: string
  doi?: string
  pmid?: string
  url: string
  trecho: string
  consultadoEm: string // ISO date
}

export interface ConectorEvidencia {
  nome: Evidencia['fonte']
  buscar(termos: string, limite: number): Promise<Evidencia[]>
}

const TIMEOUT_FONTE_MS = 8_000
const CACHE_VERSAO = 'evidencias-v1'

async function fetchJson<T>(url: string): Promise<T> {
  const controlador = new AbortController()
  const timer = setTimeout(() => controlador.abort(), TIMEOUT_FONTE_MS)
  try {
    const resp = await fetch(url, {
      signal: controlador.signal,
      headers: { 'User-Agent': 'EscribaHealth/1.0 (apoio a decisao clinica)' },
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return (await resp.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

// ─── PubMed (NCBI E-utilities: esearch → esummary) ───

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

interface PubmedSummary {
  uid?: string
  title?: string
  authors?: Array<{ name?: string }>
  pubdate?: string
  pubtype?: string[]
  elocationid?: string
  articleids?: Array<{ idtype?: string; value?: string }>
}

export const conectorPubmed: ConectorEvidencia = {
  nome: 'PUBMED',
  async buscar(termos, limite) {
    const q = encodeURIComponent(termos)
    const busca = await fetchJson<{ esearchresult?: { idlist?: string[] } }>(
      `${PUBMED_BASE}/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${limite}&term=${q}`,
    )
    const ids = busca.esearchresult?.idlist ?? []
    if (ids.length === 0) return []

    const resumo = await fetchJson<{ result?: Record<string, PubmedSummary> }>(
      `${PUBMED_BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`,
    )
    const agora = new Date().toISOString()
    return ids
      .map((id) => resumo.result?.[id])
      .filter((r): r is PubmedSummary => Boolean(r?.title))
      .map((r) => {
        const doi = r.articleids?.find((a) => a.idtype === 'doi')?.value
        return {
          fonte: 'PUBMED' as const,
          titulo: r.title ?? '',
          autores: (r.authors ?? [])
            .slice(0, 3)
            .map((a) => a.name ?? '')
            .filter(Boolean)
            .join(', '),
          tipoEstudo: (r.pubtype ?? []).join(', ') || 'Artigo',
          ano: (r.pubdate ?? '').slice(0, 4),
          doi: doi || undefined,
          pmid: r.uid,
          url: `https://pubmed.ncbi.nlm.nih.gov/${r.uid}/`,
          trecho: '', // esummary não traz abstract; título+tipo já ancoram a citação
          consultadoEm: agora,
        }
      })
  },
}

// ─── Europe PMC (REST search) ───

interface EpmcResultado {
  id?: string
  pmid?: string
  doi?: string
  title?: string
  authorString?: string
  pubYear?: string
  pubType?: string
  abstractText?: string
}

export const conectorEuropePmc: ConectorEvidencia = {
  nome: 'EUROPE_PMC',
  async buscar(termos, limite) {
    const q = encodeURIComponent(termos)
    const dados = await fetchJson<{ resultList?: { result?: EpmcResultado[] } }>(
      `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${q}&format=json&pageSize=${limite}&resultType=core`,
    )
    const agora = new Date().toISOString()
    return (dados.resultList?.result ?? [])
      .filter((r) => Boolean(r.title))
      .map((r) => ({
        fonte: 'EUROPE_PMC' as const,
        titulo: r.title ?? '',
        autores: r.authorString ?? '',
        tipoEstudo: r.pubType ?? 'Artigo',
        ano: r.pubYear ?? '',
        doi: r.doi || undefined,
        pmid: r.pmid || undefined,
        url: r.pmid
          ? `https://europepmc.org/article/MED/${r.pmid}`
          : `https://europepmc.org/search?query=${q}`,
        trecho: (r.abstractText ?? '').slice(0, 600),
        consultadoEm: agora,
      }))
  },
}

const CONECTORES: ConectorEvidencia[] = [conectorPubmed, conectorEuropePmc]

/**
 * Busca evidências nas fontes disponíveis. `termos` DEVE conter apenas
 * linguagem clínica desidentificada (preferindo inglês/MeSH).
 * Nunca lança: fontes que falham são ignoradas (o chamador deve declarar
 * a limitação quando o retorno vier vazio).
 */
export async function buscarEvidencias(termos: string, limitePorFonte = 4): Promise<Evidencia[]> {
  const limpo = termos.trim()
  if (!limpo) return []

  const chave = chaveCacheLLM({
    funcao: 'buscarEvidencias',
    args: { termos: limpo.toLowerCase(), limitePorFonte },
    modelo: 'n/a',
    versaoPrompt: CACHE_VERSAO,
  })
  const cacheado = await getCache<Evidencia[]>(chave)
  if (cacheado) return cacheado

  const resultados = await Promise.allSettled(
    CONECTORES.map((c) => c.buscar(limpo, limitePorFonte)),
  )
  const evidencias = resultados.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))

  // Dedup por PMID/DOI (as duas fontes se sobrepõem bastante).
  const vistos = new Set<string>()
  const unicas = evidencias.filter((e) => {
    const id = e.pmid ?? e.doi ?? e.url
    if (vistos.has(id)) return false
    vistos.add(id)
    return true
  })

  if (unicas.length > 0) await setCache(chave, unicas)
  return unicas
}

/** Formata as evidências numeradas para entrar no contexto do modelo. */
export function formatarEvidenciasParaPrompt(evidencias: Evidencia[]): string {
  if (evidencias.length === 0) return ''
  return evidencias
    .map(
      (e, i) =>
        `[${i + 1}] ${e.titulo} — ${e.autores} (${e.ano}; ${e.tipoEstudo}; ${
          e.pmid ? `PMID ${e.pmid}` : (e.doi ?? e.fonte)
        })${e.trecho ? `\nResumo: ${e.trecho}` : ''}`,
    )
    .join('\n\n')
}
