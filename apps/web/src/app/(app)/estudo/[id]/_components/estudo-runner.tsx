'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/lib/trpc/client'
import { QuestaoDetalhe } from '../../../questoes/[id]/_components/questao-detalhe'

type Props = { sessaoId: string; questaoIds: string[]; indiceInicial: number }

/** Modo estudo: correção comentada após cada questão, seguindo a sequência da sessão. */
export function EstudoRunner({ sessaoId, questaoIds, indiceInicial }: Props) {
  const router = useRouter()
  const [idx, setIdx] = useState(indiceInicial)
  const finalizar = trpc.sessao.finalizar.useMutation({
    onSuccess: () => router.push(`/simulado/${sessaoId}/resultado`),
  })

  const total = questaoIds.length
  const idAtual = questaoIds[idx]

  if (!idAtual) {
    return (
      <div className="space-y-4 rounded-xl border p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
        <h1 className="text-xl font-semibold">Sessão concluída</h1>
        <p className="text-sm text-muted-foreground">
          Você passou pelas {total} questões. Veja o desempenho por área ou volte ao banco.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => finalizar.mutate({ id: sessaoId })} loading={finalizar.isPending}>
            Ver resultado
          </Button>
          <Button variant="outline" asChild>
            <Link href="/questoes">Voltar ao banco</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Progress value={(idx / total) * 100} aria-label="Progresso da sessão" />
      <QuestaoDetalhe
        key={idAtual}
        id={idAtual}
        sessaoId={sessaoId}
        progresso={{ atual: idx + 1, total }}
        onProxima={() => setIdx((i) => i + 1)}
      />
    </div>
  )
}
