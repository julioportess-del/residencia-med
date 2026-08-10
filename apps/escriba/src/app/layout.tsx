import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// Inter self-hosted (variável, subset latin): build 100% offline — sem
// depender do Google Fonts em CI/deploy — e sem request externo no runtime.
const inter = localFont({
  src: './fonts/inter-var-latin.woff2',
  display: 'swap',
  weight: '100 900',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Escriba — rascunho de evolução clínica por voz',
    template: '%s | Escriba',
  },
  description:
    'Ferramenta pessoal para gravar a consulta, transcrever, filtrar o que é clinicamente relevante e gerar um rascunho de evolução (SOAP) para revisão médica.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#1f8a8a',
  width: 'device-width',
  initialScale: 1,
}

export const dynamic = 'force-dynamic'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased min-h-screen">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
