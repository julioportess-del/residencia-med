'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { OrgAdminPanel } from './org-admin-panel'
import { OrgMembroPanel } from './org-membro-panel'

export function OrgShell() {
  const status = trpc.org.status.useQuery()

  if (status.isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  if (!status.data?.temOrg) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 text-center">
          <Building2 className="mx-auto size-10 text-muted-foreground" />
          <CardTitle className="mt-4">Você ainda não pertence a uma organização</CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-md">
            Equipes, cursinhos e clínicas conseguem assinar planos B2B com seats por aluno e painel
            de administração agregado. Crie a sua ou aceite um convite.
          </CardDescription>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href="/org/criar">Criar organização</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/precos">Ver planos B2B</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status.data.papel === 'ADMIN') {
    return <OrgAdminPanel org={status.data.org} />
  }
  return <OrgMembroPanel org={status.data.org} papel={status.data.papel} />
}
