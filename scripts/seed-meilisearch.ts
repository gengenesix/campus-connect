/**
 * One-time Meilisearch seed script.
 *
 * Reads all active products and non-deleted services from Supabase and
 * bulk-indexes them into Meilisearch. Safe to run multiple times (upserts).
 *
 * Usage:
 *   npx tsx scripts/seed-meilisearch.ts
 *
 * Requires env vars (copy from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or anon key)
 *   MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { Meilisearch as MeiliSearch } from 'meilisearch'
import { setupIndexes, PRODUCTS_INDEX, SERVICES_INDEX } from '../lib/meilisearch'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const MEILI_HOST = process.env.MEILISEARCH_HOST!
const MEILI_KEY = process.env.MEILISEARCH_ADMIN_KEY!
const BATCH_SIZE = 100

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars')
  process.exit(1)
}
if (!MEILI_HOST || !MEILI_KEY) {
  console.error('Missing MEILISEARCH_HOST / MEILISEARCH_ADMIN_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const meili = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_KEY })

async function seedProducts() {
  console.log('Seeding products...')
  let offset = 0
  let total = 0

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, seller_id, title, description, price, condition, category,
        image_url, views, created_at, whatsapp, in_stock, status,
        seller:profiles!seller_id (name, avatar_url, rating, is_verified)
      `)
      .eq('status', 'active')
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) { console.error('Products fetch error:', error); break }
    if (!data || data.length === 0) break

    const docs = data.map((p: any) => ({
      id: p.id,
      seller_id: p.seller_id,
      seller_name: p.seller?.name ?? null,
      seller_avatar_url: p.seller?.avatar_url ?? null,
      seller_rating: p.seller?.rating ?? 0,
      seller_verified: p.seller?.is_verified ?? false,
      seller: p.seller ?? null,
      title: p.title,
      description: p.description ?? '',
      price: p.price,
      condition: p.condition,
      category: p.category,
      image_url: p.image_url ?? null,
      views: p.views ?? 0,
      created_at: p.created_at,
      whatsapp: p.whatsapp ?? null,
      in_stock: p.in_stock ?? true,
      status: p.status,
      university_id: p.university_id ?? null,  // null if column not yet migrated
    }))

    await meili.index(PRODUCTS_INDEX).addDocuments(docs, { primaryKey: 'id' })
    total += docs.length
    console.log(`  Indexed ${total} products...`)

    if (data.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  console.log(`Products done: ${total} indexed`)
}

async function seedServices() {
  console.log('Seeding services...')
  let offset = 0
  let total = 0

  while (true) {
    const { data, error } = await supabase
      .from('services')
      .select(`
        id, provider_id, name, description, category, rate, availability,
        image_url, response_time, total_bookings, status,
        provider:profiles!provider_id (name, avatar_url, rating, is_verified)
      `)
      .neq('status', 'deleted')
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) { console.error('Services fetch error:', error); break }
    if (!data || data.length === 0) break

    const docs = data.map((s: any) => ({
      id: s.id,
      provider_id: s.provider_id,
      provider_name: s.provider?.name ?? null,
      provider_avatar_url: s.provider?.avatar_url ?? null,
      provider_rating: s.provider?.rating ?? 0,
      provider_verified: s.provider?.is_verified ?? false,
      provider: s.provider ?? null,
      name: s.name,
      description: s.description ?? '',
      category: s.category,
      rate: s.rate ?? null,
      availability: s.availability ?? null,
      image_url: s.image_url ?? null,
      response_time: s.response_time ?? null,
      total_bookings: s.total_bookings ?? 0,
      status: s.status,
      university_id: s.university_id ?? null,
    }))

    await meili.index(SERVICES_INDEX).addDocuments(docs, { primaryKey: 'id' })
    total += docs.length
    console.log(`  Indexed ${total} services...`)

    if (data.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  console.log(`Services done: ${total} indexed`)
}

async function main() {
  console.log(`Connecting to Meilisearch at ${MEILI_HOST}...`)
  await setupIndexes()
  await seedProducts()
  await seedServices()
  console.log('\nSeed complete!')
}

main().catch(e => { console.error(e); process.exit(1) })
