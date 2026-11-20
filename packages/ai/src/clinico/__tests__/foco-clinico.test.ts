import { describe, expect, test } from 'vitest'
import { estruturaClinicaSchema, FOCO_CLINICO_VALORES } from '../tipos'

describe('focoClinico (classificação automática)', () => {
  test('aceita qualquer valor do enum e segue opcional (retrocompat)', () => {
    expect(estruturaClinicaSchema.safeParse({}).success).toBe(true)
    for (const v of FOCO_CLINICO_VALORES) {
      expect(estruturaClinicaSchema.safeParse({ focoClinico: v }).success).toBe(true)
    }
  })

  test('rejeita valor fora do enum (IA não pode inventar categoria)', () => {
    const r = estruturaClinicaSchema.safeParse({ focoClinico: 'CARDIOLOGIA_GERAL' })
    expect(r.success).toBe(false)
  })
})
