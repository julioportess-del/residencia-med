'use client'

import { useState, type FormEvent } from 'react'
import { MailCheck } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabaseBrowser } from '@/lib/supabase/client'
import { recuperarSenhaSchema } from '@/lib/validacao'

export function RecuperarSenhaForm() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)

    const analise = recuperarSenhaSchema.safeParse({ email })
    if (!analise.success) {
      setErro(analise.error.issues[0]?.message ?? 'Verifique o e-mail.')
      return
    }

    setCarregando(true)
    try {
      // Mesmo se o e-mail não existir, não revelamos — sempre mostra sucesso.
      await supabaseBrowser().auth.resetPasswordForEmail(analise.data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
      })
      setEnviado(true)
    } catch {
      setErro('Falha de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  if (enviado) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
          <MailCheck className="h-6 w-6" />
        </span>
        <div className="space-y-1">
          <p className="font-medium">Verifique seu e-mail</p>
          <p className="text-sm text-muted-foreground">
            Se houver uma conta com <strong>{email}</strong>, enviamos um link para redefinir a
            senha. O link expira em 1 hora.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
        />
      </div>

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" loading={carregando}>
        Enviar link de recuperação
      </Button>
    </form>
  )
}
