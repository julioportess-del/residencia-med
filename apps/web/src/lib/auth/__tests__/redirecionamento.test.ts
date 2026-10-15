import { describe, expect, it } from 'vitest'
import { caminhoInternoSeguro } from '../redirecionamento'

describe('caminhoInternoSeguro', () => {
  it('aceita caminho interno', () => {
    expect(caminhoInternoSeguro('/redefinir-senha')).toBe('/redefinir-senha')
    expect(caminhoInternoSeguro('/questoes?banca=ENARE')).toBe('/questoes?banca=ENARE')
  })

  it('usa o padrão quando ausente', () => {
    expect(caminhoInternoSeguro(null)).toBe('/dashboard')
    expect(caminhoInternoSeguro(undefined)).toBe('/dashboard')
    expect(caminhoInternoSeguro('')).toBe('/dashboard')
  })

  it('bloqueia redirecionamento para outro domínio', () => {
    expect(caminhoInternoSeguro('https://evil.com')).toBe('/dashboard')
    expect(caminhoInternoSeguro('//evil.com/x')).toBe('/dashboard')
    expect(caminhoInternoSeguro('/\\evil.com')).toBe('/dashboard')
    expect(caminhoInternoSeguro('javascript:alert(1)')).toBe('/dashboard')
  })
})
