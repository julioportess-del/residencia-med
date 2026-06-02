import { AuthShell } from '@/components/auth-shell'
import { RedefinirSenhaForm } from './_components/redefinir-senha-form'

export const dynamic = 'force-dynamic'

export default function RedefinirSenhaPage() {
  return (
    <AuthShell titulo="Nova senha" subtitulo="Defina uma nova senha para sua conta.">
      <RedefinirSenhaForm />
    </AuthShell>
  )
}
