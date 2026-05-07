import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // @prisma/client tem binários nativos — mantém fora do bundle pra Vercel achar
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@residencia-med/ui'],
  },
  transpilePackages: [
    '@residencia-med/ui',
    '@residencia-med/core',
    '@residencia-med/types',
    '@residencia-med/ai',
    '@residencia-med/db',
  ],
  outputFileTracingIncludes: {
    '/api/**/*': [
      '../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/*.node',
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default config
