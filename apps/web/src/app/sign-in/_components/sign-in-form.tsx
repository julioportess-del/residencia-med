'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabaseBrowser } from '@/lib/supabase/client'

export function SignInForm({ proximaUrl }: { proximaUrl: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      const { error } = await supabaseBrowser().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      })
      if (error) {
        toast.error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error.message)
        return
      }
      router.push(proximaUrl)
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  async function entrarComGoogle() {
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(proximaUrl)}`,
      },
    })
    if (error) toast.error(error.message)
  }

  return (
    <form onSubmit={entrar} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          type="password"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </Button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={entrarComGoogle}
      >
        Entrar com Google
      </Button>
    </form>
  )
}
