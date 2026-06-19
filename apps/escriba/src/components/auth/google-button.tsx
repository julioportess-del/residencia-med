'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.38Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.45-4.75H1.7v2.98A11.5 11.5 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.67a6.9 6.9 0 0 1 0-4.34V7.35H1.7a11.5 11.5 0 0 0 0 10.3l3.85-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.71 1.2 15.1 0 12 0A11.5 11.5 0 0 0 1.7 7.35l3.85 2.98C6.46 7.6 9 4.75 12 4.75Z"
      />
    </svg>
  )
}

/** Botão de login social com Google (OAuth via Supabase + callback existente). */
export function GoogleButton({ rotulo = 'Continuar com Google' }: { rotulo?: string }) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function entrar() {
    if (carregando) return
    setErro(null)
    setCarregando(true)
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error } = await supabaseBrowser().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (error) {
        setErro('Login com Google indisponível no momento. Use e-mail e senha.')
        setCarregando(false)
      }
      // Em sucesso, o navegador é redirecionado para o Google — não reseta o loading.
    } catch {
      setErro('Não foi possível conectar ao Google. Tente novamente.')
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={entrar}
        disabled={carregando}
        className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground shadow-sm transition-all hover:bg-secondary hover:shadow disabled:opacity-70"
      >
        {carregando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleGlyph className="h-5 w-5" />
        )}
        {rotulo}
      </button>
      {erro ? (
        <p role="alert" className="text-center text-xs text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  )
}
