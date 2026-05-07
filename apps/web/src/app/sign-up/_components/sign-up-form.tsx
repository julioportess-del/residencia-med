'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabaseBrowser } from '@/lib/supabase/client'

export function SignUpForm() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aguardandoEmail, setAguardandoEmail] = useState(false)

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 8) {
      toast.error('Senha precisa ter pelo menos 8 caracteres')
      return
    }
    setEnviando(true)
    try {
      const { data, error } = await supabaseBrowser().auth.signUp({
        email: email.trim().toLowerCase(),
        password: senha,
        options: {
          data: { name: nome.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      })
      if (error) {
        toast.error(error.message)
        return
      }
      // Se confirmação de email estiver desligada, há sessão imediata
      if (data.session) {
        router.push('/onboarding')
        router.refresh()
        return
      }
      setAguardandoEmail(true)
    } finally {
      setEnviando(false)
    }
  }

  if (aguardandoEmail) {
    return (
      <div className="mt-6 rounded-md border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Confirme seu e-mail</p>
        <p className="mt-1 text-muted-foreground">
          Enviamos um link de confirmação para <span className="font-medium">{email}</span>.
          Abra o e-mail e clique no link para ativar sua conta.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={criar} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          required
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
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
          autoComplete="new-password"
          minLength={8}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? 'Criando…' : 'Criar conta'}
      </Button>
    </form>
  )
}
