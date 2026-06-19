import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

/**
 * Callback do OAuth (Google) / magic links: troca o `code` por sessão e
 * persiste os cookies DIRETO no response do redirect — assim a próxima request
 * (/consultas) já enxerga a sessão e o middleware não devolve para /sign-in.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Erro vindo do provedor (ex.: usuário cancelou no Google).
  const erroProvedor = searchParams.get('error_description') ?? searchParams.get('error')
  if (erroProvedor) {
    console.error('[auth/callback] provedor retornou erro:', erroProvedor)
    return NextResponse.redirect(`${origin}/sign-in?erro=oauth`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?erro=callback`)
  }

  // Em produção atrás do proxy da Vercel, prefira o host encaminhado (domínio
  // canônico), não a URL interna do deployment.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const ehLocal = process.env.NODE_ENV === 'development'
  const base = ehLocal ? origin : forwardedHost ? `https://${forwardedHost}` : origin

  // Cookies escritos NESTE response (o que será devolvido no redirect).
  const response = NextResponse.redirect(`${base}${next}`)
  const supabase = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }))
      },
      setAll(items: Array<{ name: string; value: string; options: CookieOptions }>) {
        for (const item of items) {
          response.cookies.set(item.name, item.value, item.options)
        }
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[auth/callback] troca de code falhou:', error.message)
    return NextResponse.redirect(`${origin}/sign-in?erro=callback`)
  }

  return response
}
