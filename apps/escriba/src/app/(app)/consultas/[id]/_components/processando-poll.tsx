'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ReestruturarBotao } from './reestruturar-botao'

// Depois disso, paramos de esperar e oferecemos retry (a rota já falha sozinha
// dentro de ~60s, então isto é só uma rede de segurança).
const ESPERA_MAXIMA_MS = 120_000
const INTERVALO_MS = 3000

interface ProcessandoPollProps {
  rotulo: string
  consultaId: string
}

/** Atualiza a página enquanto processa; se demorar demais, oferece gerar de novo. */
export function ProcessandoPoll({ rotulo, consultaId }: ProcessandoPollProps) {
  const router = useRouter()
  const [desistiu, setDesistiu] = useState(false)

  useEffect(() => {
    const inicio = Date.now()
    const t = setInterval(() => {
      if (Date.now() - inicio > ESPERA_MAXIMA_MS) {
        setDesistiu(true)
        clearInterval(t)
        return
      }
      router.refresh()
    }, INTERVALO_MS)
    return () => clearInterval(t)
  }, [router])

  if (desistiu) {
    return (
      <ReestruturarBotao
        consultaId={consultaId}
        mensagem="A geração está demorando mais que o esperado. A transcrição foi salva — você pode gerar a evolução novamente."
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{rotulo}…</p>
      <p className="text-sm text-muted-foreground">
        Isso pode levar alguns instantes. A página atualiza sozinha.
      </p>
    </div>
  )
}
