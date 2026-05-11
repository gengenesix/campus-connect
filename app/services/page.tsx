import { createSupabaseReadClient } from '@/lib/supabase-server'
import { getMeilisearchSearchClient, SERVICES_INDEX } from '@/lib/meilisearch'
import ServicesPageClient from './ServicesPageClient'

const PAGE_SIZE = 20

type SearchParams = Promise<{
  q?: string
  category?: string
}>

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = '', category = '' } = await searchParams

  // ── Meilisearch path (text search) ─────────────────────────────────────────
  if (q.trim()) {
    const client = getMeilisearchSearchClient()
    if (client) {
      try {
        const filters: string[] = ['status != "deleted"']
        if (category) filters.push(`category = "${category}"`)

        const result = await client.index(SERVICES_INDEX).search(q.trim(), {
          filter: filters.join(' AND '),
          sort: ['total_bookings:desc'],
          limit: PAGE_SIZE,
          offset: 0,
        })

        return (
          <ServicesPageClient
            initialServices={result.hits as any[]}
            sp={{ q, category }}
          />
        )
      } catch (e) {
        console.error('[services/page] Meilisearch error, falling back to Supabase:', e)
      }
    }
  }

  // ── Supabase path (browse / filter without text) ───────────────────────────
  const supabase = createSupabaseReadClient()
  let query = supabase
    .from('services')
    .select(`
      id, provider_id, name, category, rate, availability, image_url, description, response_time, total_bookings,
      provider:profiles!provider_id (name, avatar_url, rating, is_verified)
    `)
    .neq('status', 'deleted')

  if (q.trim()) query = query.textSearch('search_vector', q.trim(), { type: 'websearch', config: 'english' })
  if (category) query = query.eq('category', category)

  const { data } = await query
    .order('total_bookings', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  return (
    <ServicesPageClient
      initialServices={(data ?? []) as any[]}
      sp={{ q, category }}
    />
  )
}
