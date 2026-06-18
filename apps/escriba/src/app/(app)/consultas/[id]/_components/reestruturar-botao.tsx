'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@residencia-med/ui'

interface ReestruturarBotaoProps {
  consultaId: string
  /** Texto explicativo acima do botão. */
  mensagem?: string
}

/** Regera a evolução a partir da transcrição já salva (sem regravar). */
export function ReestruturarBotao({ consultaId, mensagem }: ReestruturarBotaoProps) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function gerar() {
    if (carregando) return
    setErro(null)
    setCarregando(true)
    try {
      const res = await fetch(`/api/consultas/${consultaId}/reestruturar`, { method: 'POST' })
      const dados = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; erro: string }
        | null
      if (!res.ok || !dados || dados.ok === false) {
        setErro((dados && 'erro' in dados && dados.erro) || 'Falha ao gerar. Tente novamente.')
        return
      }
      router.refresh()
    } catch {
      setErro('Sem conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-sm text-muted-foreground">
        {mensagem ?? 'A evolução ainda não foi gerada. A transcrição está salva.'}
      </p>
      <Button onClick={gerar} disabled={carregando}>
        {carregando ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando…
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Gerar evolução novamente
          </>
        )}
      </Button>
      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  )
}
