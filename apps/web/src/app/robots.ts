import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://residencia-med.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/precos', '/docs/api'],
        disallow: [
          '/api/',
          '/dashboard',
          '/questoes',
          '/simulado',
          '/revisao',
          '/plano',
          '/conta',
          '/admin',
          '/mentor',
          '/org',
          '/convite',
          '/contribuir',
          '/live',
          '/setup',
          '/sign-in',
          '/sign-up',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
