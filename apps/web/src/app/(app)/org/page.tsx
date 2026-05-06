import { OrgShell } from './_components/org-shell'

export const metadata = { title: 'Organização' }

export default function OrgPage() {
  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      <OrgShell />
    </div>
  )
}
