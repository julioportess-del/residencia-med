import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  conectorEuropePmc,
  conectorPubmed,
  formatarEvidenciasParaPrompt,
  type Evidencia,
} from '../evidencias'

afterEach(() => vi.restoreAllMocks())

function mockFetchSequencia(respostas: unknown[]) {
  let i = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => respostas[i++],
    })),
  )
}

describe('Evidence Engine', () => {
  test('PubMed: esearch→esummary vira Evidencia com metadados reais', async () => {
    mockFetchSequencia([
      { esearchresult: { idlist: ['12345'] } },
      {
        result: {
          '12345': {
            uid: '12345',
            title: 'Hypertension treatment guideline',
            authors: [{ name: 'Silva J' }, { name: 'Souza M' }],
            pubdate: '2024 Jan',
            pubtype: ['Practice Guideline'],
            articleids: [{ idtype: 'doi', value: '10.1000/abc' }],
          },
        },
      },
    ])
    const r = await conectorPubmed.buscar('hypertension treatment', 3)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({
      fonte: 'PUBMED',
      titulo: 'Hypertension treatment guideline',
      nivel: 'DIRETRIZ',
      ano: '2024',
      pmid: '12345',
      doi: '10.1000/abc',
      url: 'https://pubmed.ncbi.nlm.nih.gov/12345/',
    })
    expect(r[0]?.consultadoEm).toBeTruthy()
  })

  test('Europe PMC: search vira Evidencia com trecho do abstract', async () => {
    mockFetchSequencia([
      {
        resultList: {
          result: [
            {
              pmid: '999',
              title: 'CAP in adults',
              authorString: 'Lima A.',
              pubYear: '2023',
              pubType: 'review',
              abstractText: 'Resumo do estudo sobre pneumonia.',
            },
          ],
        },
      },
    ])
    const r = await conectorEuropePmc.buscar('community acquired pneumonia', 3)
    expect(r[0]).toMatchObject({
      fonte: 'EUROPE_PMC',
      pmid: '999',
      trecho: 'Resumo do estudo sobre pneumonia.',
    })
  })

  test('fonte indisponível (HTTP 500) não derruba: conector lança e o chamador trata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    )
    await expect(conectorPubmed.buscar('x', 2)).rejects.toThrow('HTTP 500')
  })

  test('formatarEvidenciasParaPrompt numera [n] para o modelo citar só o que existe', () => {
    const e: Evidencia[] = [
      {
        fonte: 'PUBMED',
        titulo: 'T1',
        autores: 'A',
        tipoEstudo: 'RCT',
        nivel: 'ENSAIO_CLINICO',
        ano: '2024',
        pmid: '1',
        url: 'u',
        trecho: '',
        consultadoEm: 'now',
      },
    ]
    const txt = formatarEvidenciasParaPrompt(e)
    expect(txt).toContain('[1] [Ensaio clínico] T1')
    expect(txt).toContain('PMID 1')
    expect(formatarEvidenciasParaPrompt([])).toBe('')
  })
})
