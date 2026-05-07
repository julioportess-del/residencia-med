import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const SUPABASE_HABILITADO = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'),
)

/**
 * Server client com cookies do request — use em Server Components, Route Handlers
 * e Server Actions. Cookies são propagados pra renovar refresh tokens.
 */
export async function supabaseServer() {
  const store = await cookies()
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return store.getAll().map((c) => ({ name: c.name, value: c.value }))
      },
      setAll(items: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          for (const item of items) {
            store.set(item.name, item.value, item.options)
          }
        } catch {
          // chamado fora de Server Action — ignorar
        }
      },
    },
  })
}

/**
 * Devolve `{ user, supabase }` ou `{ user: null, supabase }` se não autenticado.
 * Suporta modo demo: quando Supabase não está configurado, devolve user nulo.
 */
export async function supabaseUserAtual() {
  if (!SUPABASE_HABILITADO) {
    return { user: null, supabase: null as never }
  }
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { user, supabase }
}
