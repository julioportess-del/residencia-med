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
 * Modo dev local: quando `DEV_USER_EMAIL` está setado, autentica automaticamente
 * como esse usuário (cria a row se não existe). Permite testar a plataforma sem
 * precisar configurar Supabase. NUNCA habilitar em produção.
 */
export const DEV_USER_EMAIL =
  process.env.NODE_ENV !== 'production' ? process.env.DEV_USER_EMAIL?.trim() || null : null

export type AuthUser = {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}

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
 * Em modo dev (DEV_USER_EMAIL), devolve um usuário sintético sem chamar Supabase.
 */
export async function supabaseUserAtual(): Promise<{
  user: AuthUser | null
  supabase: ReturnType<typeof createServerClient> | null
}> {
  if (DEV_USER_EMAIL) {
    return {
      user: {
        id: `dev-${DEV_USER_EMAIL.replace(/[^a-z0-9]/gi, '-')}`,
        email: DEV_USER_EMAIL,
        user_metadata: { name: 'Dev User' },
      },
      supabase: null,
    }
  }
  if (!SUPABASE_HABILITADO) {
    return { user: null, supabase: null }
  }
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { user: user as AuthUser | null, supabase }
}
