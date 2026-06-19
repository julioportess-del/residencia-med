import { AuthShell } from '@/components/auth-shell'
import { SignInForm } from './_components/sign-in-form'

export const dynamic = 'force-dynamic'

export default function SignInPage() {
  return (
    <AuthShell titulo="Bem-vindo de volta" subtitulo="Acesse sua conta do Escriba Health.">
      <SignInForm />
    </AuthShell>
  )
}
