import Link from 'next/link'
import { AuthShell } from '@/components/auth-shell'
import { CadastroForm } from './_components/cadastro-form'

export const dynamic = 'force-dynamic'

export default function CadastroPage() {
  return (
    <AuthShell
      titulo="Criar conta"
      subtitulo="Acesso ao Escriba para profissionais de saúde."
      rodape={
        <>
          Já tem conta?{' '}
          <Link href="/sign-in" className="font-medium text-foreground hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <CadastroForm />
    </AuthShell>
  )
}
