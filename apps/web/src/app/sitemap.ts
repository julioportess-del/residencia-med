import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://residencia-med.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date()
  return [
    {
      url: APP_URL,
      lastModified: agora,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${APP_URL}/precos`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/docs/api`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${APP_URL}/sign-up`,
      lastModified: agora,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
  ]
}
