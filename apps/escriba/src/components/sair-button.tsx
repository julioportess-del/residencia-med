'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'

/** Botão de logout: encerra a sessão Supabase e volta para a tela de entrada. */
export function SairButton() {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)

  async function sair() {
    if (saindo) return
    setSaindo(true)
    try {
      await supabaseBrowser().auth.signOut()
      router.replace('/sign-in')
      router.refresh()
    } catch {
      // Mesmo em falha de rede, leva à tela de entrada (a sessão local é limpa).
      router.replace('/sign-in')
    } finally {
      setSaindo(false)
    }
  }

  return (
    <button
      type="button"
      aria-label="Sair da conta"
      title="Sair"
      onClick={sair}
      disabled={saindo}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">{saindo ? 'Saindo…' : 'Sair'}</span>
    </button>
  )
}
