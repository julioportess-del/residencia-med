import { NextResponse, type NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const CLERK_HABILITADO = Boolean(
  PUBLISHABLE_KEY && !PUBLISHABLE_KEY.includes('placeholder'),
)

const ehRotaPublica = createRouteMatcher([
  '/',
  '/precos',
  '/setup',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health',
  '/api/trpc/banca.listar',
  '/api/trpc/planos.listar',
])

const ehRotaProtegidaDemo = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/dashboard(.*)',
  '/questoes(.*)',
  '/simulado(.*)',
  '/revisao(.*)',
  '/plano(.*)',
  '/conta(.*)',
  '/admin(.*)',
])

const middlewareDemo = (req: NextRequest) => {
  if (ehRotaProtegidaDemo(req)) {
    const url = req.nextUrl.clone()
    url.pathname = '/setup'
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

const middlewareReal = clerkMiddleware(async (auth, req) => {
  if (!ehRotaPublica(req)) {
    await auth.protect()
  }
})

export default CLERK_HABILITADO ? middlewareReal : middlewareDemo

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
