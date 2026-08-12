import { NextResponse, type NextRequest } from 'next/server'
import { atualizarSessaoSupabase } from '@/lib/supabase/middleware'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_HABILITADO = Boolean(
  SUPABASE_URL && SUPABASE_ANON && !SUPABASE_URL.includes('placeholder'),
)
const DEV_USER_EMAIL =
  process.env.NODE_ENV !== 'production' ? process.env.DEV_USER_EMAIL?.trim() || null : null

const PUBLIC_PATHS = [
  '/', // landing page pública (logados são redirecionados para /dashboard na página)
  '/sign-in',
  '/cadastro',
  '/recuperar-senha',
  '/redefinir-senha',
  '/auth/callback',
  '/setup',
]

function ehPublica(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ehApi = pathname.startsWith('/api/')

  // Rotas de API com credencial própria (Bearer da extensão Chrome, cron do
  // Vercel): a própria rota valida — o middleware não deve exigir cookie.
  if (ehApi && req.headers.get('authorization')) {
    return NextResponse.next()
  }

  // Modo dev local: pula autenticacao
  if (DEV_USER_EMAIL) {
    return NextResponse.next()
  }

  // Sem Supabase configurado — manda rotas protegidas para /setup
  if (!SUPABASE_HABILITADO) {
    if (!ehPublica(pathname)) {
      const url = req.nextUrl.clone()
      url.pathname = '/setup'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  const { response, user } = await atualizarSessaoSupabase(req)

  if (!user && !ehPublica(pathname)) {
    // API sem sessão: 401 JSON (redirect para página de login não faz
    // sentido para chamadas programáticas).
    if (ehApi) {
      return NextResponse.json({ ok: false, erro: 'Não autenticado.' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
