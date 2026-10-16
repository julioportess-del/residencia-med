/**
 * Contas master (dono/admin da plataforma) têm acesso total, sem assinatura.
 * Fonte única: env ADMIN_EMAILS (mesma lista que libera /admin).
 */

export function listaContasMaster(
  valorEnv: string | undefined = process.env.ADMIN_EMAILS,
): string[] {
  return (valorEnv ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function ehContaMaster(
  email: string | null | undefined,
  lista: readonly string[] = listaContasMaster(),
): boolean {
  if (!email) return false
  return lista.includes(email.trim().toLowerCase())
}
