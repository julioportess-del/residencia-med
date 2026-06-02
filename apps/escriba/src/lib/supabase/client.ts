'use client'

import { createBrowserClient } from '@supabase/ssr'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

let _client: ReturnType<typeof createBrowserClient> | null = null

export function supabaseBrowser() {
  if (!_client) {
    _client = createBrowserClient(URL, ANON)
  }
  return _client
}
