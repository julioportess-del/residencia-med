import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignInForm } from './_components/sign-in-form'

export const dynamic = 'force-dynamic'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-4">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
            <p className="text-sm text-muted-foreground">Acesso pessoal ao Escriba.</p>
          </div>
          <SignInForm />
        </div>
      </main>
    </div>
  )
}
