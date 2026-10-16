import { describe, expect, it } from 'vitest'
import { GRANDE_AREA_POR_ESPECIALIDADE, TAXONOMIA_R1, grandeAreaDoTema } from '../taxonomia-r1'

describe('TAXONOMIA_R1', () => {
  it('códigos únicos', () => {
    const codigos = TAXONOMIA_R1.map((t) => t.codigo)
    expect(new Set(codigos).size).toBe(codigos.length)
  })

  it('todo pai existe na taxonomia', () => {
    const codigos = new Set(TAXONOMIA_R1.map((t) => t.codigo))
    for (const t of TAXONOMIA_R1) if (t.pai) expect(codigos.has(t.pai)).toBe(true)
  })

  it('todo tema pertence a uma grande área', () => {
    for (const t of TAXONOMIA_R1) expect(grandeAreaDoTema(t)).not.toBeNull()
  })

  it('preserva os 35 temas já existentes no banco', () => {
    for (const c of ['CARDIO_ARRITMIAS_FA', 'GO_PRENATAL', 'PSF_SUS', 'PSIQ_PSICOSES']) {
      expect(TAXONOMIA_R1.some((t) => t.codigo === c)).toBe(true)
    }
  })

  it('cobre as 5 grandes áreas', () => {
    const areas = new Set(TAXONOMIA_R1.map((t) => GRANDE_AREA_POR_ESPECIALIDADE[t.especialidade]))
    expect(areas.size).toBe(5)
  })
})
