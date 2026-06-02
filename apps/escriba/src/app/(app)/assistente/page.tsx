import { exigirUsuario } from '@/lib/auth'
import { AssistenteChat } from './_components/assistente-chat'

export const dynamic = 'force-dynamic'

export default async function AssistentePage() {
  await exigirUsuario()

  return (
    <div className="mx-auto max-w-2xl">
      <AssistenteChat />
    </div>
  )
}
