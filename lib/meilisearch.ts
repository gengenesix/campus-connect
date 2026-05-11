import { Meilisearch as MeiliSearch } from 'meilisearch'

export const PRODUCTS_INDEX = 'products'
export const SERVICES_INDEX = 'services'

let _adminClient: MeiliSearch | null = null

/** Admin client (for indexing / settings — server-side only) */
export function getMeilisearchClient(): MeiliSearch | null {
  const host = process.env.MEILISEARCH_HOST
  const key = process.env.MEILISEARCH_ADMIN_KEY
  if (!host || !key) return null
  if (!_adminClient) {
    _adminClient = new MeiliSearch({ host, apiKey: key })
  }
  return _adminClient
}

/** Search client (uses search-only key — safe for API routes) */
export function getMeilisearchSearchClient(): MeiliSearch | null {
  const host = process.env.MEILISEARCH_HOST
  // Prefer the search-only key; fall back to admin key for single-key setups
  const key = process.env.MEILISEARCH_SEARCH_KEY ?? process.env.MEILISEARCH_ADMIN_KEY
  if (!host || !key) return null
  return new MeiliSearch({ host, apiKey: key })
}

// ─── Index setup ────────────────────────────────────────────────────────────

export async function setupIndexes() {
  const client = getMeilisearchClient()
  if (!client) return

  try {
    await client.index(PRODUCTS_INDEX).updateSettings({
      searchableAttributes: ['title', 'description', 'seller_name', 'category', 'condition'],
      filterableAttributes: ['category', 'condition', 'status', 'university_id', 'in_stock'],
      sortableAttributes: ['price', 'views', 'created_at'],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
      },
      pagination: { maxTotalHits: 10000 },
    })

    await client.index(SERVICES_INDEX).updateSettings({
      searchableAttributes: ['name', 'description', 'provider_name', 'category'],
      filterableAttributes: ['category', 'status', 'university_id'],
      sortableAttributes: ['total_bookings'],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
      },
      pagination: { maxTotalHits: 10000 },
    })
  } catch (e) {
    console.error('[Meilisearch] setupIndexes error:', e)
  }
}

// ─── Document helpers ────────────────────────────────────────────────────────

/** Index or update a product document. No-op if Meilisearch is not configured. */
export async function indexProduct(doc: Record<string, unknown>) {
  const client = getMeilisearchClient()
  if (!client) return
  try {
    await client.index(PRODUCTS_INDEX).addDocuments([doc], { primaryKey: 'id' })
  } catch (e) {
    console.error('[Meilisearch] indexProduct error:', e)
  }
}

/** Index or update a service document. No-op if Meilisearch is not configured. */
export async function indexService(doc: Record<string, unknown>) {
  const client = getMeilisearchClient()
  if (!client) return
  try {
    await client.index(SERVICES_INDEX).addDocuments([doc], { primaryKey: 'id' })
  } catch (e) {
    console.error('[Meilisearch] indexService error:', e)
  }
}

/** Remove a product from the index. No-op if Meilisearch is not configured. */
export async function removeProduct(id: string) {
  const client = getMeilisearchClient()
  if (!client) return
  try {
    await client.index(PRODUCTS_INDEX).deleteDocument(id)
  } catch (e) {
    console.error('[Meilisearch] removeProduct error:', e)
  }
}

/** Remove a service from the index. No-op if Meilisearch is not configured. */
export async function removeService(id: string) {
  const client = getMeilisearchClient()
  if (!client) return
  try {
    await client.index(SERVICES_INDEX).deleteDocument(id)
  } catch (e) {
    console.error('[Meilisearch] removeService error:', e)
  }
}
