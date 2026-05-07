import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

/**
 * Endpoint de troca de código por sessão (OAuth + email confirm).
 * Supabase redireciona pra cá com `?code=...` após login externo ou confirmação.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const proximaUrl = url.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await supabaseServer()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(proximaUrl, req.url))
}
