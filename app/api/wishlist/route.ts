import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const ToggleSchema = z.object({
  productId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
}).refine(d => d.productId || d.serviceId, { message: 'productId or serviceId required' })

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = ToggleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { productId, serviceId } = parsed.data

  // Check if already saved
  let existingQuery = supabase
    .from('saved_listings')
    .select('id')
    .eq('user_id', session.user.id)

  if (productId) existingQuery = existingQuery.eq('product_id', productId)
  if (serviceId) existingQuery = existingQuery.eq('service_id', serviceId)

  const { data: existing } = await existingQuery.maybeSingle()

  if (existing) {
    // Unsave
    await supabase.from('saved_listings').delete().eq('id', existing.id)
    return NextResponse.json({ saved: false })
  } else {
    // Save
    await supabase.from('saved_listings').insert({
      user_id: session.user.id,
      product_id: productId ?? null,
      service_id: serviceId ?? null,
    })
    return NextResponse.json({ saved: true })
  }
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'products' | 'services' | null (all)

  // Check if specific IDs are saved (for bulk check on list pages)
  const ids = searchParams.get('ids')?.split(',').filter(Boolean)
  if (ids?.length) {
    let q = supabase
      .from('saved_listings')
      .select('product_id, service_id')
      .eq('user_id', session.user.id)

    if (type === 'products') q = q.in('product_id', ids)
    else if (type === 'services') q = q.in('service_id', ids)

    const { data } = await q
    const savedProductIds = new Set((data ?? []).map((r: { product_id: string | null }) => r.product_id).filter(Boolean))
    const savedServiceIds = new Set((data ?? []).map((r: { service_id: string | null }) => r.service_id).filter(Boolean))
    return NextResponse.json({ savedProductIds: [...savedProductIds], savedServiceIds: [...savedServiceIds] })
  }

  // Full saved list
  let query = supabase
    .from('saved_listings')
    .select(`
      id, created_at,
      product:products!product_id (id, title, price, condition, category, image_url, status, seller_id,
        seller:profiles!seller_id (name, avatar_url, is_verified, rating)),
      service:services!service_id (id, name, rate, category, image_url, status, provider_id,
        provider:profiles!provider_id (name, avatar_url, is_verified, rating))
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (type === 'products') query = query.not('product_id', 'is', null)
  if (type === 'services') query = query.not('service_id', 'is', null)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ saved: data ?? [] })
}
