import { AceitarConvite } from './_components/aceitar-convite'

export const metadata = { title: 'Aceitar convite' }

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <div className="container mx-auto max-w-md px-6 py-16">
      <AceitarConvite token={token} />
    </div>
  )
}
