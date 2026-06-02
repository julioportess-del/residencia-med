import { redirect } from 'next/navigation'
import { usuarioAtual, type AuthUser } from '@/lib/supabase/server'

/** Garante usuario autenticado em Server Components; redireciona se ausente. */
export async function exigirUsuario(): Promise<AuthUser> {
  const { user } = await usuarioAtual()
  if (!user) {
    redirect('/sign-in')
  }
  return user
}
