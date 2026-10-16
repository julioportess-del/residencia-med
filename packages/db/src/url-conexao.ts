/**
 * Em serverless (Vercel), cada função abre suas próprias conexões. O pooler do
 * Supabase em modo SESSÃO (porta 5432) limita a 15 clientes e estoura
 * (EMAXCONNSESSION). O modo TRANSAÇÃO (6543) com pgbouncer=true é o indicado
 * para Prisma em serverless. Migrations continuam usando DIRECT_URL.
 */
const PORTA_SESSAO = '5432'
const PORTA_TRANSACAO = '6543'
const HOST_POOLER_SUPABASE = '.pooler.supabase.com'

export function urlParaServerless(url: string | undefined): string | undefined {
  if (!url) return url
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return url
  }
  if (!u.hostname.endsWith(HOST_POOLER_SUPABASE)) return url
  if (u.port === PORTA_SESSAO) u.port = PORTA_TRANSACAO
  if (!u.searchParams.has('pgbouncer')) u.searchParams.set('pgbouncer', 'true')
  if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '1')
  return u.toString()
}
