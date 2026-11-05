import { describe, expect, it } from 'vitest'
import {
  gerarIdCuid,
  hashEnunciado,
  limparAlternativa,
  montarSqlImportacao,
  ProvaTranscritaSchema,
  validarProvaTranscrita,
  type ProvaTranscrita,
} from '../importacao-prova'

const alts = { A: 'A. um', B: 'B. dois', C: 'C. três', D: 'D. quatro', E: 'E. cinco' }

function prova(p: Partial<ProvaTranscrita> = {}): ProvaTranscrita {
  return ProvaTranscritaSchema.parse({
    ano: 2026,
    totalQuestoes: 2,
    gabarito: { '1': 'E', '2': 'B' },
    anuladas: [],
    questoes: [
      { numero: 1, enunciado: 'Homem, 55 anos, com dor.', alternativas: alts },
      { numero: 2, enunciado: 'Mulher, 60 anos.', alternativas: alts },
    ],
    ...p,
  })
}

describe('limparAlternativa', () => {
  it('remove a letra repetida do caderno', () => {
    expect(limparAlternativa('A. Vitamina K', 'A')).toBe('Vitamina K')
    expect(limparAlternativa('b) dois', 'B')).toBe('dois')
    expect(limparAlternativa('Ácido fólico', 'A')).toBe('Ácido fólico')
  })
})

describe('hashEnunciado', () => {
  it('ignora acentos, caixa e espaços', () => {
    expect(hashEnunciado('Homem,  55 anos')).toBe(hashEnunciado('homem, 55 ANOS'))
    expect(hashEnunciado('Pressão')).toBe(hashEnunciado('pressao'))
  })
})

describe('validarProvaTranscrita', () => {
  it('normaliza alternativas e gabarito', () => {
    const r = validarProvaTranscrita(prova())
    expect(r.erros).toEqual([])
    expect(r.questoes[0]?.alternativas[0]).toEqual({ letra: 'A', texto: 'um' })
    expect(r.questoes[1]?.gabarito).toBe('B')
  })

  it('aponta questão ausente e gabarito inválido', () => {
    const r = validarProvaTranscrita(prova({ totalQuestoes: 3, gabarito: { '1': 'E', '2': 'Z' } }))
    expect(r.erros).toContain('Questão 3 ausente')
    expect(r.erros.some((e) => e.includes('Questão 2: gabarito inválido'))).toBe(true)
  })

  it('anulada fica sem gabarito, com aviso e sem erro', () => {
    const r = validarProvaTranscrita(prova({ anuladas: [2], gabarito: { '1': 'E', '2': null } }))
    expect(r.erros).toEqual([])
    expect(r.questoes[1]?.gabarito).toBeNull()
    expect(r.avisos[0]).toContain('anulada')
  })

  it('erro quando há menos de 4 alternativas', () => {
    const p = prova()
    p.questoes[0] = { ...p.questoes[0]!, alternativas: { A: 'x', B: 'y', C: 'z' } }
    expect(validarProvaTranscrita(p).erros[0]).toContain('só 3 alternativas')
  })
})

describe('gerarIdCuid', () => {
  it('passa na validação cuid do zod', async () => {
    const { z } = await import('zod')
    expect(z.string().cuid().safeParse(gerarIdCuid()).success).toBe(true)
  })
})

describe('montarSqlImportacao', () => {
  const { questoes } = validarProvaTranscrita(
    prova({ anuladas: [2], gabarito: { '1': 'E', '2': null } }),
  )
  const sql = montarSqlImportacao({
    bancaCodigo: 'SUS-SP',
    ano: 2026,
    tipo: 'R1',
    titulo: "SUS-SP 2026 — d'acesso direto",
    fonte: 'teste',
    questoes: questoes.map((q) => ({ ...q, imagens: q.numero === 1 ? ['https://x/1.png'] : [] })),
  })

  it('é idempotente (ON CONFLICT em prova, questão e alternativa)', () => {
    expect(sql).toContain('ON CONFLICT ("bancaId", ano, tipo) DO NOTHING')
    expect(sql.match(/ON CONFLICT \(hash\) DO NOTHING/g)).toHaveLength(2)
    expect(sql.match(/ON CONFLICT \("questaoId", letra\) DO NOTHING/g)).toHaveLength(2)
  })

  it('escapa aspas e marca a alternativa correta', () => {
    expect(sql).toContain("d''acesso")
    expect(sql).toMatch(/'E', 'cinco', true/)
    expect(sql).toMatch(/'A', 'um', false/)
  })

  it('anulada entra despublicada e imagens viram array', () => {
    expect(sql).toContain("ARRAY['https://x/1.png']::TEXT[]")
    expect(sql).toMatch(/, 2, 'teste', '[0-9a-f]{64}', false, ARRAY\[\]::TEXT\[\]/)
  })
})
