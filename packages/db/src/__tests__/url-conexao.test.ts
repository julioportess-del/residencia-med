import { describe, expect, it } from 'vitest'
import { urlParaServerless } from '../url-conexao'

const SESSAO = 'postgresql://postgres.abc:segredo@aws-1-sa-east-1.pooler.supabase.com:5432/postgres'

describe('urlParaServerless', () => {
  it('troca o pooler do Supabase de sessão (5432) para transação (6543) com pgbouncer', () => {
    const u = new URL(urlParaServerless(SESSAO)!)
    expect(u.port).toBe('6543')
    expect(u.searchParams.get('pgbouncer')).toBe('true')
    expect(u.searchParams.get('connection_limit')).toBe('1')
    expect(u.password).toBe('segredo')
  })

  it('preserva parâmetros existentes e não duplica', () => {
    const u = new URL(urlParaServerless(`${SESSAO}?sslmode=require&connection_limit=3`)!)
    expect(u.searchParams.get('sslmode')).toBe('require')
    expect(u.searchParams.get('connection_limit')).toBe('3')
  })

  it('não mexe em banco que não é pooler do Supabase (ex.: local)', () => {
    const local = 'postgresql://u:p@localhost:5432/db'
    expect(urlParaServerless(local)).toBe(local)
  })

  it('já em modo transação: só garante pgbouncer', () => {
    const u = new URL(urlParaServerless(SESSAO.replace(':5432', ':6543'))!)
    expect(u.port).toBe('6543')
    expect(u.searchParams.get('pgbouncer')).toBe('true')
  })

  it('sem URL → undefined; URL inválida → devolve como veio', () => {
    expect(urlParaServerless(undefined)).toBeUndefined()
    expect(urlParaServerless('nao-e-url')).toBe('nao-e-url')
  })
})
