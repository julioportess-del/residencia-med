import { redirect } from 'next/navigation'
import { supabaseUserAtual } from '@/lib/supabase/server'
import { garantirUser } from '@/server/trpc'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

/**
 * Garante usuário logado em Server Component. Redireciona para /sign-in se não.
 */
export async function exigirUser() {
  const { user: authUser } = await supabaseUserAtual()
  if (!authUser?.email) redirect('/sign-in')
  return garantirUser(authUser.id, authUser.email)
}

/**
 * Garante usuário admin. Redireciona para /sign-in se não logado, /dashboard se logado mas não admin.
 */
export async function exigirAdmin() {
  const user = await exigirUser()
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect('/dashboard')
  }
  return user
}
