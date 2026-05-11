import { NextRequest, NextResponse } from 'next/server'
import {
  indexProduct,
  indexService,
  removeProduct,
  removeService,
} from '@/lib/meilisearch'
import { inngest } from '@/lib/inngest'

/**
 * POST /api/search/sync
 *
 * Called by Supabase Database Webhooks when products or services change.
 * Set up in Supabase Dashboard → Database → Webhooks:
 *
 *   Table: products  | Events: Insert, Update, Delete
 *   URL:   https://your-domain.com/api/search/sync
 *   HTTP Headers:
 *     x-sync-secret: <MEILISEARCH_SYNC_SECRET env var>
 *
 * Repeat for the services table.
 *
 * Payload format (Supabase sends):
 *   { type: 'INSERT'|'UPDATE'|'DELETE', table: string, record: {...}, old_record: {...} }
 */
export async function POST(req: NextRequest) {
  // Verify shared secret to prevent unauthorized index manipulation
  const secret = process.env.MEILISEARCH_SYNC_SECRET
  if (secret) {
    const provided = req.headers.get('x-sync-secret')
    if (provided !== secret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let body: {
    type: 'INSERT' | 'UPDATE' | 'DELETE'
    table: string
    record: Record<string, unknown> | null
    old_record: Record<string, unknown> | null
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, table, record, old_record } = body

  if (table === 'products') {
    if (type === 'DELETE') {
      const id = (old_record?.id ?? record?.id) as string | undefined
      if (id) await removeProduct(id)
    } else {
      // INSERT or UPDATE
      if (!record) return NextResponse.json({ ok: true })
      const status = record.status as string
      if (status === 'active') {
        await indexProduct(record)
        // Notify seller via Inngest (email + in-app notification)
        const wasNotActive = old_record?.status !== 'active'
        if (wasNotActive) {
          void inngest.send({
            name: 'listing/approved',
            data: { listingId: record.id as string, listingType: 'product' },
          })
        }
      } else {
        // If status changed away from active, remove from index so it stops appearing in search
        const id = record.id as string
        if (id) await removeProduct(id)
      }
    }
    return NextResponse.json({ ok: true })
  }

  if (table === 'services') {
    if (type === 'DELETE') {
      const id = (old_record?.id ?? record?.id) as string | undefined
      if (id) await removeService(id)
    } else {
      if (!record) return NextResponse.json({ ok: true })
      const status = record.status as string
      if (status !== 'deleted') {
        await indexService(record)
        // Notify provider if newly approved (status moved to active)
        if (status === 'active' && old_record?.status !== 'active') {
          void inngest.send({
            name: 'listing/approved',
            data: { listingId: record.id as string, listingType: 'service' },
          })
        }
      } else {
        const id = record.id as string
        if (id) await removeService(id)
      }
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
