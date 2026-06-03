import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Stethoscope } from 'lucide-react'
import { supabaseUserAtual, SUPABASE_HABILITADO } from '@/lib/supabase/server'
import { SignInForm } from './_components/sign-in-form'

export const metadata = { title: 'Entrar' }

type Props = { searchParams: Promise<{ next?: string }> }

export default async function SignInPage({ searchParams }: Props) {
  const sp = await searchParams
  const proximaUrl = sp.next ?? '/dashboard'

  if (SUPABASE_HABILITADO) {
    const { user } = await supabaseUserAtual()
    if (user) redirect(proximaUrl)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Stethoscope className="size-5 text-primary" />
          <span className="font-bold">Residência Med</span>
        </Link>
        <div className="rounded-xl border bg-background p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse sua conta para continuar.</p>
          <SignInForm proximaUrl={proximaUrl} />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
