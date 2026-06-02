'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@residencia-med/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabaseBrowser } from '@/lib/supabase/client'
import { redefinirSenhaSchema } from '@/lib/validacao'

export function RedefinirSenhaForm() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [temSessao, setTemSessao] = useState<boolean | null>(null)

  // O link de recuperação cria uma sessão (via /auth/callback). Sem ela, o
  // usuário chegou aqui sem um link válido.
  useEffect(() => {
    let ativo = true
    async function checarSessao() {
      try {
        const { data } = await supabaseBrowser().auth.getSession()
        if (ativo) setTemSessao(Boolean(data.session))
      } catch {
        if (ativo) setTemSessao(false)
      }
    }
    void checarSessao()
    return () => {
      ativo = false
    }
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)

    const analise = redefinirSenhaSchema.safeParse({ senha, confirmarSenha })
    if (!analise.success) {
      setErro(analise.error.issues[0]?.message ?? 'Verifique os campos.')
      return
    }

    setCarregando(true)
    try {
      const { error } = await supabaseBrowser().auth.updateUser({ password: analise.data.senha })
      if (error) {
        setErro('Não foi possível redefinir a senha. Solicite um novo link e tente de novo.')
        return
      }
      router.replace('/consultas')
      router.refresh()
    } catch {
      setErro('Falha de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  if (temSessao === false) {
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Link inválido ou expirado. Volte e solicite um novo link de recuperação.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="senha">Nova senha</Label>
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
        <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
        <Input
          id="confirmarSenha"
          type="password"
          autoComplete="new-password"
          required
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          placeholder="Repita a nova senha"
        />
      </div>

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" loading={carregando || temSessao === null}>
        Salvar nova senha
      </Button>
    </form>
  )
}
