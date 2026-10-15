'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabaseBrowser } from '@/lib/supabase/client'

const TAMANHO_MINIMO_SENHA = 8

export function RedefinirSenhaForm() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)

  const senhasDiferentes = confirmacao.length > 0 && senha !== confirmacao

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < TAMANHO_MINIMO_SENHA) {
      toast.error(`A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`)
      return
    }
    if (senha !== confirmacao) {
      toast.error('As senhas não conferem.')
      return
    }
    setEnviando(true)
    try {
      const { error } = await supabaseBrowser().auth.updateUser({ password: senha })
      if (error) {
        toast.error(
          error.code === 'same_password'
            ? 'A nova senha precisa ser diferente da anterior.'
            : 'Não foi possível salvar. Peça um novo link e tente de novo.',
        )
        return
      }
      toast.success('Senha atualizada.')
      router.push('/dashboard')
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="senha">Nova senha</Label>
        <Input
          id="senha"
          type="password"
          required
          minLength={TAMANHO_MINIMO_SENHA}
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmacao">Confirmar senha</Label>
        <Input
          id="confirmacao"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={senhasDiferentes}
          aria-describedby={senhasDiferentes ? 'erro-confirmacao' : undefined}
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
        {senhasDiferentes && (
          <p id="erro-confirmacao" className="text-xs text-destructive">
            As senhas não conferem.
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? 'Salvando…' : 'Salvar nova senha'}
      </Button>
    </form>
  )
}
