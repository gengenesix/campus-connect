import { createSupabaseReadClient } from '@/lib/supabase-server'
import { getMeilisearchSearchClient, PRODUCTS_INDEX } from '@/lib/meilisearch'
import GoodsPageClient from './GoodsPageClient'

const PAGE_SIZE = 20

type SearchParams = Promise<{
  q?: string
  condition?: string
  category?: string
  sort?: string
}>

export default async function GoodsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = '', condition = '', category = '', sort = 'newest' } = await searchParams

  // ── Meilisearch path (text search) ─────────────────────────────────────────
  if (q.trim()) {
    const client = getMeilisearchSearchClient()
    if (client) {
      try {
        const filters: string[] = ['status = "active"']
        if (category) filters.push(`category = "${category}"`)
        if (condition) filters.push(`condition = "${condition}"`)

        const sortBy: string[] = []
        if (sort === 'price-low') sortBy.push('price:asc')
        else if (sort === 'price-high') sortBy.push('price:desc')
        else if (sort === 'popular') sortBy.push('views:desc')

        const result = await client.index(PRODUCTS_INDEX).search(q.trim(), {
          filter: filters.join(' AND '),
          sort: sortBy.length ? sortBy : undefined,
          limit: PAGE_SIZE,
          offset: 0,
        })

        return (
          <GoodsPageClient
            initialProducts={result.hits as any[]}
            sp={{ q, condition, category, sort }}
          />
        )
      } catch (e) {
        console.error('[goods/page] Meilisearch error, falling back to Supabase:', e)
      }
    }
  }

  // ── Supabase path (browse / filter without text) ───────────────────────────
  const supabase = createSupabaseReadClient()
  let query = supabase
    .from('products')
    .select(`
      id, seller_id, title, price, condition, category, image_url, views, description, created_at, whatsapp, in_stock,
      seller:profiles!seller_id (name, avatar_url, rating, is_verified)
    `)
    .eq('status', 'active')

  if (q.trim()) query = query.textSearch('search_vector', q.trim(), { type: 'websearch', config: 'english' })
  if (condition) query = query.eq('condition', condition)
  if (category) query = query.eq('category', category)

  if (sort === 'price-low') query = query.order('price', { ascending: true })
  else if (sort === 'price-high') query = query.order('price', { ascending: false })
  else if (sort === 'popular') query = query.order('views', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data } = await query.range(0, PAGE_SIZE - 1)

  return (
    <GoodsPageClient
      initialProducts={(data ?? []) as any[]}
      sp={{ q, condition, category, sort }}
    />
  )
}
