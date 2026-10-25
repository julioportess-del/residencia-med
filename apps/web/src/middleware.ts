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
  '/',
  '/precos',
  '/setup',
  '/docs/api',
  '/sign-in',
  '/sign-up',
  '/recuperar-senha',
  '/auth/callback',
  '/api/webhooks',
  '/api/health',
  '/api/v1',
  '/api/trpc/banca.listar',
  '/api/trpc/planos.listar',
]

const PROTECTED_DEMO_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/recuperar-senha',
  '/redefinir-senha',
  '/onboarding',
  '/dashboard',
  '/questoes',
  '/estudo',
  '/caderno',
  '/flashcards',
  '/simulado',
  '/revisao',
  '/plano',
  '/provas',
  '/foco',
  '/cursos',
  '/conta',
  '/admin',
  '/mentor',
  '/org',
  '/convite',
  '/contribuir',
  '/live',
]

function ehPublica(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => {
    if (p === '/') return pathname === '/'
    return pathname === p || pathname.startsWith(`${p}/`)
  })
}

function ehProtegidaDemo(pathname: string): boolean {
  return PROTECTED_DEMO_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Modo dev local: pula autenticação completamente
  if (DEV_USER_EMAIL) {
    return NextResponse.next()
  }

  // Modo demo (sem Supabase) — redireciona rotas protegidas pra /setup
  if (!SUPABASE_HABILITADO) {
    if (ehProtegidaDemo(pathname)) {
      const url = req.nextUrl.clone()
      url.pathname = '/setup'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  const { response, user } = await atualizarSessaoSupabase(req)

  // Redireciona pra sign-in se rota protegida e sem sessão
  if (!user && !ehPublica(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
