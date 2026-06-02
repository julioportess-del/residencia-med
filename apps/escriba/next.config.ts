import path from 'node:path'
import type { NextConfig } from 'next'
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin'

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', 'prisma', 'openai', '@anthropic-ai/sdk', 'ioredis'],
  // Monorepo + Prisma client com output customizado: garante que o engine nativo
  // (libquery_engine-*.so.node) seja incluido no bundle serverless da Vercel.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  outputFileTracingIncludes: {
    '/**/*': ['../../packages/db-clinico/src/generated/client/**/*'],
  },
  // PrismaPlugin copia o engine nativo para junto do output do webpack no build server.
  webpack: (webpackConfig, { isServer }) => {
    if (isServer) {
      webpackConfig.plugins = [...webpackConfig.plugins, new PrismaPlugin()]
    }
    return webpackConfig
  },
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
