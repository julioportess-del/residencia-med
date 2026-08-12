'use client'

import { useState } from 'react'
import { Check, ClipboardCopy, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Alert } from '@/components/ui/alert'

/**
 * Gera o token de conexão da extensão Chrome. O valor aparece UMA única
 * vez (só o hash fica no servidor); gerar um novo revoga o anterior.
 */
export function ExtensaoToken() {
  const [token, setToken] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function gerar() {
    setGerando(true)
    setErro(null)
    try {
      const resp = await fetch('/api/ext/token', { method: 'POST' })
      const dados = (await resp.json().catch(() => null)) as
        | { ok: true; token: string }
        | { ok: false; erro: string }
        | null
      if (!resp.ok || !dados || dados.ok === false) {
        setErro((dados && 'erro' in dados && dados.erro) || 'Falha ao gerar o token.')
        return
      }
      setToken(dados.token)
    } catch {
      setErro('Falha de rede. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  async function copiar() {
    if (!token) return
    await navigator.clipboard.writeText(token)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Conecte a extensão do Chrome para gravar consultas direto de dentro do seu prontuário
        (Feegow). Gere o token e cole na extensão — uma única vez.
      </p>

      {token ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted px-3 py-2 text-xs">
              {token}
            </code>
            <Button size="sm" variant="outline" onClick={copiar}>
              {copiado ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
              {copiado ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Guarde agora: este valor não será mostrado de novo. Gerar outro token revoga este.
          </p>
        </div>
      ) : (
        <Button variant="outline" onClick={gerar} loading={gerando} disabled={gerando}>
          {gerando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Gerar token da extensão
        </Button>
      )}

      {erro ? <Alert variant="destructive">{erro}</Alert> : null}
    </div>
  )
}
