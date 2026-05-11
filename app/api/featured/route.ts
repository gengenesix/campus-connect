import { NextResponse } from 'next/server'
import { createSupabaseReadClient } from '@/lib/supabase-server'
import { cacheGet, cacheSet } from '@/lib/cache'

const CACHE_KEY = 'featured:v1'
const TTL = 60 // seconds

// GET /api/featured — cached featured goods + services for homepage
// Redis cache (60s TTL) with HTTP edge cache fallback.
// No auth required — public listing snapshot.
export async function GET() {
  // Redis cache hit
  const cached = await cacheGet<{ goods: unknown[]; services: unknown[] }>(CACHE_KEY)
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        'X-Cache': 'HIT',
      },
    })
  }

  const supabase = createSupabaseReadClient()

  const [{ data: goods }, { data: services }] = await Promise.all([
    supabase
      .from('products')
      .select('id, seller_id, title, price, condition, category, image_url, views, description, created_at, seller:profiles!seller_id (name, avatar_url, rating, is_verified)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('services')
      .select('id, provider_id, name, category, rate, image_url, description, response_time, total_bookings, availability, provider:profiles!provider_id (name, avatar_url, rating, is_verified)')
      .neq('status', 'deleted')
      .order('total_bookings', { ascending: false })
      .limit(8),
  ])

  const result = { goods: goods ?? [], services: services ?? [] }

  // Populate cache — no-op if Redis is not configured
  await cacheSet(CACHE_KEY, result, TTL)

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      'X-Cache': 'MISS',
    },
  })
}
