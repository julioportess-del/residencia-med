import { describe, expect, it } from 'vitest'
import { ehContaMaster, listaContasMaster } from '../conta-master'

describe('listaContasMaster', () => {
  it('normaliza a lista vinda do ambiente', () => {
    expect(listaContasMaster(' Julio@Exemplo.com , outra@x.com,,')).toEqual([
      'julio@exemplo.com',
      'outra@x.com',
    ])
  })

  it('ambiente vazio → ninguém é master', () => {
    expect(listaContasMaster(undefined)).toEqual([])
  })
})

describe('ehContaMaster', () => {
  const lista = ['julio@exemplo.com']

  it('reconhece o e-mail independente de caixa e espaços', () => {
    expect(ehContaMaster('  JULIO@exemplo.com ', lista)).toBe(true)
  })

  it('outros e-mails não são master', () => {
    expect(ehContaMaster('aluno@exemplo.com', lista)).toBe(false)
  })

  it('sem e-mail não é master', () => {
    expect(ehContaMaster(null, lista)).toBe(false)
    expect(ehContaMaster(undefined, lista)).toBe(false)
  })
})
