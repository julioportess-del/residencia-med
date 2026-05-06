'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, Crown, Download, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

const COR_PLANO: Record<string, string> = {
  FREE: 'bg-secondary text-secondary-foreground',
  PRO: 'bg-primary text-primary-foreground',
  PREMIUM: 'bg-amber-500 text-white',
}

export function ContaCliente() {
  const router = useRouter()
  const meu = trpc.billing.meuPlano.useQuery()
  const uso = trpc.billing.uso.useQuery()
  const [confirmacao, setConfirmacao] = useState('')
  const [dialogExcluir, setDialogExcluir] = useState(false)

  const portal = trpc.billing.abrirPortal.useMutation({
    onSuccess: ({ url }) => (window.location.href = url),
    onError: (e) => toast.error(e.message ?? 'Erro ao abrir portal'),
  })

  const excluir = trpc.conta.excluir.useMutation({
    onSuccess: () => {
      toast.success('Conta excluída.')
      router.push('/')
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao excluir conta'),
  })

  if (meu.isLoading) return <Skeleton className="mt-6 h-96" />

  const plano = meu.data?.plano ?? 'FREE'
  const ass = meu.data?.assinatura
  const ehFree = plano === 'FREE'

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="size-4" />
            Plano atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge className={COR_PLANO[plano] ?? COR_PLANO.FREE}>{plano}</Badge>
              {ass?.status && ass.status !== 'ATIVA' && (
                <Badge variant="outline" className="ml-2">
                  {ass.status}
                </Badge>
              )}
            </div>
            {ass?.validaAte && (
              <span className="text-sm text-muted-foreground">
                Renova em {format(ass.validaAte, 'dd/MM/yyyy')}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {ehFree ? (
              <Button asChild>
                <Link href="/precos">Fazer upgrade</Link>
              </Button>
            ) : (
              <Button onClick={() => portal.mutate()} loading={portal.isPending}>
                <ExternalLink className="size-4" />
                Gerenciar assinatura
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uso do mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsoLinha
            label="Questões respondidas"
            usado={uso.data?.questoesMes ?? 0}
            limite={plano === 'FREE' ? 100 : -1}
          />
          <UsoLinha
            label="Simulados (semana)"
            usado={uso.data?.simuladosSemana ?? 0}
            limite={plano === 'FREE' ? 1 : -1}
          />
          <UsoLinha
            label="Explicações IA"
            usado={uso.data?.iaMes ?? 0}
            limite={plano === 'FREE' ? 0 : plano === 'PRO' ? 50 : -1}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade e dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              <div className="font-medium">Exportar meus dados</div>
              <p className="text-muted-foreground text-xs">
                Baixe perfil, respostas, sessões e plano em JSON (LGPD).
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/api/conta/exportar" download>
                <Download className="size-4" />
                Exportar JSON
              </a>
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 border-t pt-3">
            <div className="text-sm">
              <div className="font-medium text-rose-600">Excluir minha conta</div>
              <p className="text-muted-foreground text-xs">
                Irreversível. Cancela assinatura ativa e remove todos os dados.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setDialogExcluir(true)}>
              <Trash2 className="size-4" />
              Excluir conta
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogExcluir} onOpenChange={setDialogExcluir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" />
              Excluir conta permanentemente
            </DialogTitle>
            <DialogDescription>
              Sua assinatura será cancelada e todos os dados (respostas, simulados, plano) serão
              removidos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Digite <code className="rounded bg-muted px-1">EXCLUIR</code> para confirmar
            </label>
            <Input value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogExcluir(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={confirmacao !== 'EXCLUIR'}
              loading={excluir.isPending}
              onClick={() => excluir.mutate({ confirmacao: 'EXCLUIR' })}
            >
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UsoLinha({
  label,
  usado,
  limite,
}: {
  label: string
  usado: number
  limite: number
}) {
  const ilimitado = limite === -1
  const bloqueado = limite === 0
  const pct = ilimitado || bloqueado ? 0 : Math.min(100, (usado / limite) * 100)

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {bloqueado ? 'Indisponível no plano' : `${usado} / ${ilimitado ? '∞' : limite}`}
        </span>
      </div>
      {!ilimitado && !bloqueado && <Progress value={pct} className="mt-2" />}
    </div>
  )
}
