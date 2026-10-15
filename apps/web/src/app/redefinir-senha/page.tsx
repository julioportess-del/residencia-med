import Link from 'next/link'
import { Stethoscope } from 'lucide-react'
import { RedefinirSenhaForm } from './redefinir-senha-form'

export const metadata = { title: 'Nova senha' }

export default function RedefinirSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Stethoscope className="size-5 text-primary" />
          <span className="font-bold">Residência Med</span>
        </Link>
        <div className="rounded-xl border bg-background p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Criar nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha uma senha com pelo menos 8 caracteres.
          </p>
          <RedefinirSenhaForm />
        </div>
      </div>
    </div>
  )
}
