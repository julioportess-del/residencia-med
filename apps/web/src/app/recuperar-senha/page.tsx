import Link from 'next/link'
import { Stethoscope } from 'lucide-react'
import { RecuperarSenhaForm } from './recuperar-senha-form'

export const metadata = { title: 'Recuperar senha' }

export default function RecuperarSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Stethoscope className="size-5 text-primary" />
          <span className="font-bold">Residência Med</span>
        </Link>
        <div className="rounded-xl border bg-background p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Recuperar senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </p>
          <RecuperarSenhaForm />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Lembrou a senha?{' '}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
