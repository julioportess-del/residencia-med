import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { TRPCProvider } from '@/lib/trpc/provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Residencia Med',
    template: '%s | Residencia Med',
  },
  description:
    'Plataforma de estudo para residencia medica baseada em analise de bancas, repeticao espacada e IA.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" className={inter.variable}>
        <body className="bg-background text-foreground font-sans antialiased min-h-screen">
          <TRPCProvider>{children}</TRPCProvider>
          <Toaster position="top-center" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
