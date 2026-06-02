import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', 'prisma', 'openai', '@anthropic-ai/sdk', 'ioredis'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@residencia-med/ui'],
  },
  transpilePackages: [
    '@residencia-med/ui',
    '@residencia-med/types',
    '@residencia-med/ai',
    '@residencia-med/db-clinico',
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          // Microfone liberado apenas para a propria origem (gravacao da consulta).
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ]
  },
}

export default config
