import { Brand } from '@/components/brand'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function SetupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-4">
        <Brand />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Configuração necessária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              O Escriba ainda não tem autenticação configurada. Para usar localmente sem Supabase,
              defina <code className="text-foreground">DEV_USER_EMAIL</code> no arquivo{' '}
              <code className="text-foreground">apps/escriba/.env</code>:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-foreground">
              DEV_USER_EMAIL=&quot;dev@residencia-med.local&quot;
            </pre>
            <p>
              Para produção, configure{' '}
              <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
              <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> com as
              credenciais do seu projeto Supabase.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
