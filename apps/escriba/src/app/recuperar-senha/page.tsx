import Link from 'next/link'
import { AuthShell } from '@/components/auth-shell'
import { RecuperarSenhaForm } from './_components/recuperar-senha-form'

export const dynamic = 'force-dynamic'

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      titulo="Recuperar senha"
      subtitulo="Enviaremos um link para você criar uma nova senha."
      rodape={
        <Link href="/sign-in" className="font-medium text-foreground hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <RecuperarSenhaForm />
    </AuthShell>
  )
}
