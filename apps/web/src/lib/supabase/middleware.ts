import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

/**
 * Atualiza a sessão Supabase em cada request — propaga cookies refresh-token.
 * Devolve `{ response, user }`. Use o response para retornar ou redirecionar.
 */
export async function atualizarSessaoSupabase(req: NextRequest) {
  let response = NextResponse.next({ request: req })

  const supabase = createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }))
      },
      setAll(items: Array<{ name: string; value: string; options: CookieOptions }>) {
        for (const item of items) {
          req.cookies.set(item.name, item.value)
        }
        response = NextResponse.next({ request: req })
        for (const item of items) {
          response.cookies.set(item.name, item.value, item.options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
