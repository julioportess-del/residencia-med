import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { TRPCProvider } from '@/lib/trpc/provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://residencia-med.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'Residência Med — Aprovação em residência médica acelerada por dados',
    template: '%s | Residência Med',
  },
  description:
    'Plataforma de estudo para residência médica com análise de 10 anos das principais bancas (AMRIGS, ENARE, USP, UNIFESP, UNICAMP), plano adaptativo, repetição espaçada e cada erro explicado com guideline citado.',
  keywords: [
    'residência médica',
    'AMRIGS',
    'ENARE',
    'USP residência',
    'UNIFESP residência',
    'simulado residência',
    'questões residência médica',
    'banco de questões médicas',
    'plano de estudos residência',
    'IA medicina',
  ],
  metadataBase: new URL(APP_URL),
  alternates: { canonical: '/' },
  authors: [{ name: 'Residência Med' }],
  category: 'education',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: APP_URL,
    siteName: 'Residência Med',
    title: 'Residência Med — Aprovação em residência médica acelerada por dados',
    description:
      'Análise de 10 anos da sua banca, plano adaptativo, repetição espaçada e cada erro explicado com guideline. Fim do estudo às cegas.',
    // imagem é gerada dinamicamente em /opengraph-image (next/og convention)
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Residência Med',
    description: 'Análise de 10 anos da sua banca, plano adaptativo, repetição espaçada e IA.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
}

export const dynamic = 'force-dynamic'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased min-h-screen">
        <ThemeProvider>
          <TRPCProvider>{children}</TRPCProvider>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
