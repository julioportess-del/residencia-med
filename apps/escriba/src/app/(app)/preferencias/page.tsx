import { exigirUsuario } from '@/lib/auth'
import { obterPreferencias } from '@/server/preferencias'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PreferenciasForm } from './_components/preferencias-form'
import { ExtensaoToken } from './_components/extensao-token'

export const dynamic = 'force-dynamic'

export default async function PreferenciasPage() {
  const user = await exigirUsuario()
  const pref = await obterPreferencias(user.id)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Preferências</h1>
        <p className="text-sm text-muted-foreground">
          Personalize como a IA estrutura suas evoluções. Estas configurações são aplicadas a todas
          as próximas consultas — não afetam dados de pacientes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personalização da evolução</CardTitle>
        </CardHeader>
        <CardContent>
          <PreferenciasForm inicial={pref} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extensão Chrome (Feegow)</CardTitle>
        </CardHeader>
        <CardContent>
          <ExtensaoToken />
        </CardContent>
      </Card>
    </div>
  )
}
