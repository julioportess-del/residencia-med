'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MailCheck } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabaseBrowser } from '@/lib/supabase/client'
import { cadastroSchema } from '@/lib/validacao'

export function CadastroForm() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [confirmacaoEnviada, setConfirmacaoEnviada] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)

    const analise = cadastroSchema.safeParse({ nome, email, senha, confirmarSenha })
    if (!analise.success) {
      setErro(analise.error.issues[0]?.message ?? 'Verifique os campos.')
      return
    }

    setCarregando(true)
    try {
      const { data, error } = await supabaseBrowser().auth.signUp({
        email: analise.data.email,
        password: analise.data.senha,
        options: {
          data: { name: analise.data.nome },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setErro(
          error.message.toLowerCase().includes('already')
            ? 'Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.'
            : 'Não foi possível criar a conta. Tente novamente.',
        )
        return
      }

      // Sessão já criada (confirmação de e-mail desativada) → entra direto.
      if (data.session) {
        router.replace('/consultas')
        router.refresh()
        return
      }
      // Confirmação de e-mail necessária.
      setConfirmacaoEnviada(true)
    } catch {
      setErro('Falha de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  if (confirmacaoEnviada) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
          <MailCheck className="h-6 w-6" />
        </span>
        <div className="space-y-1">
          <p className="font-medium">Confirme seu e-mail</p>
          <p className="text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>. Abra o e-mail e clique no
            link para ativar sua conta.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          autoComplete="name"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Dra. Vanessa"
        />
      </div>

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

      <div className="space-y-1.5">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          type="password"
          autoComplete="new-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmarSenha">Confirmar senha</Label>
        <Input
          id="confirmarSenha"
          type="password"
          autoComplete="new-password"
          required
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          placeholder="Repita a senha"
        />
      </div>

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" loading={carregando}>
        Criar conta
      </Button>
    </form>
  )
}
