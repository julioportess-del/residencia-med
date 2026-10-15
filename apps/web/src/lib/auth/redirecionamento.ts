export const DESTINO_PADRAO = '/dashboard'

/**
 * Só permite redirecionar para caminhos do próprio site — evita open redirect
 * via `?next=https://outro-dominio` ou `//outro-dominio`.
 */
export function caminhoInternoSeguro(proximo: string | null | undefined): string {
  if (!proximo || !proximo.startsWith('/')) return DESTINO_PADRAO
  if (proximo.startsWith('//') || proximo.startsWith('/\\')) return DESTINO_PADRAO
  return proximo
}
