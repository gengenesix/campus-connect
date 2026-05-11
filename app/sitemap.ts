import { MetadataRoute } from 'next'
import { createSupabaseReadClient } from '@/lib/supabase-server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://campusconnect.gh'

export const revalidate = 3600 // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseReadClient()

  const [productsRes, servicesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5000),
    supabase
      .from('services')
      .select('id, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5000),
  ])

  const productUrls: MetadataRoute.Sitemap = (productsRes.data ?? []).map(p => ({
    url: `${BASE_URL}/goods/${p.id}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const serviceUrls: MetadataRoute.Sitemap = (servicesRes.data ?? []).map(s => ({
    url: `${BASE_URL}/services/${s.id}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/goods`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/services`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/subscribe`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  return [...staticUrls, ...productUrls, ...serviceUrls]
}
