import { redirect } from 'next/navigation'
import { supabaseUserAtual } from '@/lib/supabase/server'
import { garantirUser } from '@/server/trpc'
import { AppShell } from './_components/app-shell'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user: authUser } = await supabaseUserAtual()
  if (!authUser?.email) redirect('/sign-in')

  let user
  try {
    user = await garantirUser(authUser.id, authUser.email)
  } catch (e) {
    // Erro temporário — exibir pra triar
    return (
      <div style={{ padding: 40, fontFamily: 'monospace' }}>
        <h1 style={{ color: 'red' }}>Erro ao provisionar usuário</h1>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fee', padding: 16 }}>
          authId: {authUser.id}
          {'\n'}email: {authUser.email}
          {'\n'}error: {(e as Error).message}
          {'\n'}stack: {(e as Error).stack?.substring(0, 500)}
        </pre>
      </div>
    )
  }

  const onboardingCompleto = Boolean(
    user.bancasAlvo.length > 0 &&
      user.dataProva &&
      user.cargaHorariaSemanal &&
      user.metaResidencia,
  )

  return (
    <AppShell
      user={{
        nome: user.name ?? user.email.split('@')[0] ?? 'Estudante',
        email: user.email,
      }}
      onboardingCompleto={onboardingCompleto}
    >
      {children}
    </AppShell>
  )
}
