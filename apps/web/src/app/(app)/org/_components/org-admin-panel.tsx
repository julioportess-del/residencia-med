'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Activity,
  CreditCard,
  ExternalLink,
  ListChecks,
  Mail,
  Send,
  Trash2,
  UserMinus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

type Org = {
  id: string
  name: string
  plano: string
  seats: number
  membros: number
  assinatura: { status: string; validaAte: Date | null } | null
}

export function OrgAdminPanel({ org }: { org: Org }) {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{org.name}</h1>
          <p className="mt-2 text-muted-foreground">
            Painel de administração — você é admin desta organização.
          </p>
        </div>
        <Badge variant="outline">{org.plano}</Badge>
      </div>

      <CartaoAssinatura org={org} />
      <DashboardAgregado />
      <ListaMembros />
      <ConvidarMembro />
    </div>
  )
}

function CartaoAssinatura({ org }: { org: Org }) {
  const utils = trpc.useUtils()
  const portal = trpc.org.abrirPortal.useMutation({
    onSuccess: ({ url }) => (window.location.href = url),
    onError: (e) => toast.error(e.message ?? 'Falha ao abrir portal'),
  })
  const checkout = trpc.org.iniciarCheckout.useMutation({
    onSuccess: ({ url }) => (window.location.href = url),
    onError: (e) => toast.error(e.message ?? 'Falha ao iniciar checkout'),
  })
  const temAssinatura = Boolean(org.assinatura?.status)
  const ehTrial = org.assinatura?.status === 'TRIAL'
  void utils

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-4" />
          Assinatura e seats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Plano" valor={org.plano} />
          <Stat label="Seats contratados" valor={org.seats.toString()} />
          <Stat label="Status" valor={org.assinatura?.status ?? 'Sem assinatura'} />
        </div>
        {org.assinatura?.validaAte && (
          <p className="text-sm text-muted-foreground">
            Renova em {format(org.assinatura.validaAte, 'dd/MM/yyyy')}.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {temAssinatura ? (
            <Button onClick={() => portal.mutate()} loading={portal.isPending}>
              <ExternalLink className="size-4" />
              Gerenciar no Stripe
            </Button>
          ) : (
            <>
              <Button
                onClick={() => checkout.mutate({ plano: 'STARTER', seats: 10 })}
                loading={checkout.isPending}
              >
                Assinar STARTER (10 seats)
              </Button>
              <Button
                variant="outline"
                onClick={() => checkout.mutate({ plano: 'GROWTH', seats: 50 })}
                loading={checkout.isPending}
              >
                Assinar GROWTH (50 seats)
              </Button>
            </>
          )}
        </div>
        {ehTrial && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
            Você está em período de teste de 14 dias. Após esse período, é necessário ativar a
            cobrança para manter a equipe com plano premium.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardAgregado() {
  const dash = trpc.org.dashboardAgregado.useQuery()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4" />
          Atividade da equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dash.isLoading ? (
          <Skeleton className="h-32" />
        ) : !dash.data ? null : (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Membros" valor={dash.data.usuariosTotal.toString()} />
              <Stat label="Ativos (30d)" valor={dash.data.ativos30d.toString()} />
              <Stat label="Respostas (30d)" valor={dash.data.respostasMes.toString()} />
              <Stat label="Taxa média" valor={`${Math.round(dash.data.taxaMedia * 100)}%`} />
            </div>
            {dash.data.temasFracos.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Top 5 temas que a equipe mais erra</div>
                <ul className="space-y-1.5">
                  {dash.data.temasFracos.map((t) => (
                    <li
                      key={t.tema}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span>{t.tema}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {Math.round(t.taxa * 100)}% acerto · {t.total} respostas
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ListaMembros() {
  const membros = trpc.org.membros.useQuery()
  const convitesPend = trpc.org.convitesPendentes.useQuery()
  const utils = trpc.useUtils()

  const remover = trpc.org.removerMembro.useMutation({
    onSuccess: async () => {
      toast.success('Membro removido')
      await utils.org.membros.invalidate()
      await utils.org.status.invalidate()
    },
    onError: (e) => toast.error(e.message ?? 'Erro'),
  })
  const alterar = trpc.org.alterarPapel.useMutation({
    onSuccess: async () => {
      toast.success('Papel alterado')
      await utils.org.membros.invalidate()
    },
    onError: (e) => toast.error(e.message ?? 'Erro'),
  })
  const revogar = trpc.org.revogarConvite.useMutation({
    onSuccess: async () => {
      toast.success('Convite revogado')
      await utils.org.convitesPendentes.invalidate()
    },
    onError: (e) => toast.error(e.message ?? 'Erro'),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4" />
          Membros e convites
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {membros.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <ul className="divide-y">
            {membros.data?.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{m.name ?? m.email.split('@')[0]}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={m.papelOrg === 'ADMIN' ? 'default' : 'outline'}>
                    {m.papelOrg ?? 'MEMBRO'}
                  </Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    <ListChecks className="inline size-3 mr-0.5" />
                    {m._count.respostas}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      alterar.mutate({
                        userId: m.id,
                        papel: m.papelOrg === 'ADMIN' ? 'MEMBRO' : 'ADMIN',
                      })
                    }
                  >
                    Trocar papel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Remover ${m.email}?`)) {
                        remover.mutate({ userId: m.id })
                      }
                    }}
                  >
                    <UserMinus className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {convitesPend.data && convitesPend.data.length > 0 && (
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
              Convites pendentes
            </div>
            <ul className="space-y-1.5">
              {convitesPend.data.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-md border bg-amber-50/40 p-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.email}</span>
                    <Badge variant="outline">{c.papel}</Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      expira {format(c.expiraEm, 'dd/MM')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revogar.mutate({ conviteId: c.id })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ConvidarMembro() {
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState<'ADMIN' | 'MEMBRO'>('MEMBRO')
  const utils = trpc.useUtils()
  const convidar = trpc.org.convidar.useMutation({
    onSuccess: async () => {
      toast.success('Convite enviado')
      setEmail('')
      await utils.org.convitesPendentes.invalidate()
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao convidar'),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="size-4" />
          Convidar novo membro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!email.includes('@')) return
            convidar.mutate({ email, papel })
          }}
          className="flex flex-wrap gap-2"
        >
          <div className="flex-1 min-w-[240px]">
            <Label htmlFor="email-convite">Email</Label>
            <Input
              id="email-convite"
              type="email"
              placeholder="aluno@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Papel</Label>
            <div className="mt-1 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={papel === 'MEMBRO' ? 'primary' : 'outline'}
                onClick={() => setPapel('MEMBRO')}
              >
                Membro
              </Button>
              <Button
                type="button"
                size="sm"
                variant={papel === 'ADMIN' ? 'primary' : 'outline'}
                onClick={() => setPapel('ADMIN')}
              >
                Admin
              </Button>
            </div>
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={convidar.isPending}>
              Enviar convite
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Stat({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{valor}</div>
    </div>
  )
}
