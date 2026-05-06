import { describe, expect, it } from 'vitest'
import { PLANOS_B2B, PLANOS_B2C, precoFormatado } from '../plans'
import { temAcesso } from '../limits'

describe('PLANOS_B2C', () => {
  it('FREE bloqueia IA', () => {
    expect(PLANOS_B2C.FREE.limites.iaExplicacoesMes).toBe(0)
    expect(PLANOS_B2C.FREE.limites.gerarQuestoesIA).toBe(false)
  })

  it('PRO permite IA limitada', () => {
    expect(PLANOS_B2C.PRO.limites.iaExplicacoesMes).toBeGreaterThan(0)
    expect(PLANOS_B2C.PRO.limites.gerarQuestoesIA).toBe(false)
  })

  it('PREMIUM e ilimitado em tudo', () => {
    expect(PLANOS_B2C.PREMIUM.limites.iaExplicacoesMes).toBe(-1)
    expect(PLANOS_B2C.PREMIUM.limites.gerarQuestoesIA).toBe(true)
    expect(PLANOS_B2C.PREMIUM.limites.questoesMes).toBe(-1)
  })

  it('PRO < PREMIUM em preco', () => {
    expect(PLANOS_B2C.PRO.precoMensalCentavos).toBeLessThan(PLANOS_B2C.PREMIUM.precoMensalCentavos)
  })

  it('Ciclo anual oferece desconto', () => {
    const proMensalAnualizado = PLANOS_B2C.PRO.precoMensalCentavos * 12
    expect(PLANOS_B2C.PRO.precoAnualCentavos).toBeLessThan(proMensalAnualizado)
  })
})

describe('PLANOS_B2B', () => {
  it('STARTER cobre 10 alunos no preco fixo', () => {
    expect(PLANOS_B2B.STARTER.seatsIncluidos).toBe(10)
  })

  it('GROWTH cobre 50 alunos com seat adicional barato', () => {
    expect(PLANOS_B2B.GROWTH.seatsIncluidos).toBe(50)
    expect(PLANOS_B2B.GROWTH.seatAdicionalCentavos).toBeLessThan(
      PLANOS_B2B.STARTER.seatAdicionalCentavos,
    )
  })
})

describe('precoFormatado', () => {
  it('formata centavos em BRL', () => {
    expect(precoFormatado(1900)).toMatch(/R\$\s*19,00/)
    expect(precoFormatado(0)).toMatch(/R\$\s*0,00/)
  })
})

describe('temAcesso', () => {
  it('FREE nao tem acesso a IA', () => {
    expect(temAcesso('FREE', 'iaExplicacoesMes')).toBe(false)
  })

  it('PRO tem acesso a IA mas nao gera questoes', () => {
    expect(temAcesso('PRO', 'iaExplicacoesMes')).toBe(true)
    expect(temAcesso('PRO', 'gerarQuestoesIA')).toBe(false)
  })

  it('PREMIUM tem acesso a tudo', () => {
    expect(temAcesso('PREMIUM', 'gerarQuestoesIA')).toBe(true)
    expect(temAcesso('PREMIUM', 'exportRelatorios')).toBe(true)
  })
})
