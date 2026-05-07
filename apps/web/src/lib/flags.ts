/**
 * Flags de configuracao baseadas em variaveis de ambiente publicas.
 * Servem tanto no servidor quanto no cliente (qualquer var NEXT_PUBLIC_).
 */

export function authHabilitado(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && anon && !url.includes('placeholder'))
}
