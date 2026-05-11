import { NextRequest, NextResponse } from 'next/server'
import { getMeilisearchSearchClient, PRODUCTS_INDEX, SERVICES_INDEX } from '@/lib/meilisearch'
import { createSupabaseReadClient } from '@/lib/supabase-server'
import { getRateLimiter } from '@/lib/ratelimit'

const PAGE_SIZE = 20

// GET /api/search
// Query params: q, type (products|services), category, condition, sort, page, limit
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const type = searchParams.get('type') === 'services' ? 'services' : 'products'
  const category = searchParams.get('category') ?? ''
  const condition = searchParams.get('condition') ?? ''
  const sort = searchParams.get('sort') ?? 'newest'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? String(PAGE_SIZE))))

  // Rate limit: 60 req/min per IP (scraping prevention)
  const limiter = getRateLimiter(60, '1 m')
  if (limiter) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
    const { success } = await limiter.limit(`search:${ip}`)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  // ── Meilisearch path (only when q is set) ──────────────────────────────────
  if (q) {
    const client = getMeilisearchSearchClient()
    if (client) {
      try {
        const indexName = type === 'services' ? SERVICES_INDEX : PRODUCTS_INDEX

        const filters: string[] = []
        if (type === 'products') {
          filters.push('status = "active"')
          if (category) filters.push(`category = "${category}"`)
          if (condition) filters.push(`condition = "${condition}"`)
        } else {
          filters.push('status != "deleted"')
          if (category) filters.push(`category = "${category}"`)
        }

        const sortBy: string[] = []
        if (sort === 'price-low') sortBy.push('price:asc')
        else if (sort === 'price-high') sortBy.push('price:desc')
        else if (sort === 'popular') sortBy.push(type === 'products' ? 'views:desc' : 'total_bookings:desc')

        const result = await client.index(indexName).search(q, {
          filter: filters.length ? filters.join(' AND ') : undefined,
          sort: sortBy.length ? sortBy : undefined,
          limit,
          offset: (page - 1) * limit,
        })

        return NextResponse.json({
          hits: result.hits,
          totalHits: result.estimatedTotalHits ?? result.hits.length,
          page,
          hasMore: ((result.estimatedTotalHits ?? 0) > page * limit),
          processingTimeMs: result.processingTimeMs,
          source: 'meilisearch',
        })
      } catch (e) {
        console.error('[/api/search] Meilisearch error, falling back to Supabase:', e)
        // fall through to Supabase
      }
    }
  }

  // ── Supabase fallback (or no q) ────────────────────────────────────────────
  const supabase = createSupabaseReadClient()
  const offset = (page - 1) * limit

  if (type === 'services') {
    let query = supabase
      .from('services')
      .select(`
        id, provider_id, name, category, rate, availability, image_url,
        description, response_time, total_bookings,
        provider:profiles!provider_id (name, avatar_url, rating, is_verified)
      `)
      .neq('status', 'deleted')

    if (q) query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' })
    if (category) query = query.eq('category', category)

    const { data } = await query
      .order('total_bookings', { ascending: false })
      .range(offset, offset + limit - 1)

    const hits = data ?? []
    return NextResponse.json({
      hits,
      totalHits: hits.length,
      page,
      hasMore: hits.length === limit,
      source: 'supabase',
    })
  }

  // Products
  let query = supabase
    .from('products')
    .select(`
      id, seller_id, title, price, condition, category, image_url,
      views, description, created_at, whatsapp, in_stock,
      seller:profiles!seller_id (name, avatar_url, rating, is_verified)
    `)
    .eq('status', 'active')

  if (q) query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' })
  if (category) query = query.eq('category', category)
  if (condition) query = query.eq('condition', condition)

  if (sort === 'price-low') query = query.order('price', { ascending: true })
  else if (sort === 'price-high') query = query.order('price', { ascending: false })
  else if (sort === 'popular') query = query.order('views', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data } = await query.range(offset, offset + limit - 1)
  const hits = data ?? []
  return NextResponse.json({
    hits,
    totalHits: hits.length,
    page,
    hasMore: hits.length === limit,
    source: 'supabase',
  })
}
