import { NextResponse, type NextRequest } from 'next/server'
import { caminhoInternoSeguro } from '@/lib/auth/redirecionamento'
import { supabaseServer } from '@/lib/supabase/server'

/**
 * Endpoint de troca de código por sessão (OAuth, confirmação de e-mail e
 * link de recuperação de senha). Supabase redireciona pra cá com `?code=...`.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const proximaUrl = caminhoInternoSeguro(url.searchParams.get('next'))

  if (code) {
    const supabase = await supabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const falha = new URL('/sign-in', req.url)
      falha.searchParams.set('erro', 'link-invalido')
      return NextResponse.redirect(falha)
    }
  }

  return NextResponse.redirect(new URL(proximaUrl, req.url))
}
