import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Stethoscope } from 'lucide-react'
import { supabaseUserAtual, SUPABASE_HABILITADO } from '@/lib/supabase/server'
import { SignUpForm } from './_components/sign-up-form'

export const metadata = { title: 'Criar conta' }

export default async function SignUpPage() {
  if (SUPABASE_HABILITADO) {
    const { user } = await supabaseUserAtual()
    if (user) redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Stethoscope className="size-5 text-primary" />
          <span className="font-bold">Residência Med</span>
        </Link>
        <div className="rounded-xl border bg-background p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Criar conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece grátis. Sem cartão.
          </p>
          <SignUpForm />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
