'use client'

import { useState } from 'react'
import { MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabaseBrowser } from '@/lib/supabase/client'

export function RecuperarSenhaForm() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      const { error } = await supabaseBrowser().auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha` },
      )
      // Erro de limite de envio é o único que vale mostrar; "e-mail não existe"
      // não é revelado para não permitir descobrir quem tem conta.
      if (error && error.status === 429) {
        toast.error('Muitas tentativas. Aguarde alguns minutos e tente de novo.')
        return
      }
      setEnviado(true)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div role="status" className="mt-6 flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
        <MailCheck className="size-5 shrink-0 text-primary" />
        <p>
          Se houver uma conta com <strong>{email}</strong>, você receberá um e-mail com o link em
          instantes. Confira também a caixa de spam.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="mt-6 space-y-4">
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
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar link'}
      </Button>
    </form>
  )
}
