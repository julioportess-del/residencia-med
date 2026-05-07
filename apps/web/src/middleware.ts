import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const protectedRoutes = [
    '/onboarding',
    '/painel',
    '/questões',
    '/simulado',
    '/revisão',
    '/plano',
    '/conta',
    '/admin',
    '/mentor',
    '/org',
    '/convite',
    '/contribuir',
    '/ao vivo',
  ]

const SUPABASE_HABILITADO = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
  )

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

  // Public routes - always accessible
  const isPublicRoute = [
        '/',
        '/precos',
        '/configurar',
        '/setup',
        '/docs',
      ].some(route => pathname === route || pathname.startsWith('/api/') || pathname.startsWith('/entrar') || pathname.startsWith('/inscrever-se'))

  if (!SUPABASE_HABILITADO) {
        // Demo mode: redirect protected routes to /setup
      const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
        if (isProtected) {
                const url = request.nextUrl.clone()
                url.pathname = '/setup'
                return NextResponse.rewrite(url)
        }
        return NextResponse.next()
  }

  // Supabase Auth mode
  let response = NextResponse.next({
        request,
  })

  const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
            cookies: {
                      getAll() {
                                  return request.cookies.getAll()
                      },
                      setAll(cookiesToSet) {
                                  cookiesToSet.forEach(({ name, value }) =>
                                                request.cookies.set(name, value)
                                                                 )
                                  response = NextResponse.next({
                                                request,
                                  })
                                  cookiesToSet.forEach(({ name, value, options }) =>
                                                response.cookies.set(name, value, options)
                                                                 )
                      },
            },
    }
      )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtected && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/entrar'
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
