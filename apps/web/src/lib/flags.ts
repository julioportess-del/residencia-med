/**
 * Flags de configuracao baseadas em variaveis de ambiente publicas.
 * Servem tanto no servidor quanto no cliente (qualquer var NEXT_PUBLIC_).
 */

export function clerkHabilitado(): boolean {
  const k = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return Boolean(k && !k.includes('placeholder'))
}
