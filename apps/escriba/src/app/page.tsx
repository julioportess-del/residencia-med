import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing/landing-page'

export const dynamic = 'force-dynamic'

export default async function RootPage() {
  const { user } = await usuarioAtual()
  if (user) redirect('/dashboard')
  return <LandingPage />
}
