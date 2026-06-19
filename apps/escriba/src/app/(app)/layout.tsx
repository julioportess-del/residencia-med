import { exigirUsuario } from '@/lib/auth'
import { AppNav } from '@/components/app-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await exigirUsuario()
  const nome =
    (user.user_metadata?.name as string | undefined) ?? user.email.split('@')[0] ?? 'Médico'

  return (
    <div className="min-h-screen">
      <AppNav nome={nome} />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
