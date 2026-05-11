import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getRateLimiter } from '@/lib/ratelimit'
import { indexProduct } from '@/lib/meilisearch'

// POST /api/listings — create a product listing (rate-limited: 5 per 10 minutes per user)
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting via Upstash (gracefully skipped if not configured)
  const limiter = getRateLimiter(5, '10 m')
  if (limiter) {
    const { success } = await limiter.limit(`listing:${user.id}`)
    if (!success) {
      return NextResponse.json(
        { error: 'You\'re creating listings too quickly. Wait a few minutes.' },
        { status: 429 }
      )
    }
  }

  const body = await req.json()
  const { title, description, price, category, condition, imageUrl, whatsapp, inStock } = body

  if (!title?.trim() || !category || !condition || !price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify user is not banned and get their data for Meilisearch indexing
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, university_id, name, avatar_url, rating, is_verified, subscription_expires_at')
    .eq('id', user.id)
    .single()

  if (profile?.is_banned) {
    return NextResponse.json({ error: 'Account is suspended' }, { status: 403 })
  }

  const subExpiry = (profile as any)?.subscription_expires_at
  if (!subExpiry || new Date(subExpiry) <= new Date()) {
    return NextResponse.json(
      { error: 'Active seller subscription required. Subscribe at /subscribe for GHS 20/month.', code: 'SUBSCRIPTION_REQUIRED' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      title: title.trim(),
      description: description?.trim() ?? '',
      price: Number(price),
      category,
      condition,
      image_url: imageUrl ?? null,
      whatsapp: whatsapp?.trim() || null,
      in_stock: inStock !== false,
      status: 'pending',
      university_id: profile?.university_id ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Save additional images (up to 4)
  const additionalImages = Array.isArray(body.additionalImages) ? body.additionalImages : []
  if (additionalImages.length > 0) {
    await supabase.from('product_images').insert(
      additionalImages.slice(0, 4).map((url: string, i: number) => ({
        product_id: data.id,
        image_url: url,
        display_order: i,
      }))
    )
  }

  // Fire-and-forget: index to Meilisearch (status=pending, won't show until approved)
  void indexProduct({
    id: data.id,
    seller_id: user.id,
    seller_name: profile?.name ?? null,
    seller_avatar_url: profile?.avatar_url ?? null,
    seller_rating: profile?.rating ?? 0,
    seller_verified: profile?.is_verified ?? false,
    seller: { name: profile?.name ?? null, avatar_url: profile?.avatar_url ?? null, rating: profile?.rating ?? 0, is_verified: profile?.is_verified ?? false },
    title: title.trim(),
    description: (body.description as string)?.trim() ?? '',
    price: Number(price),
    category,
    condition,
    image_url: body.imageUrl ?? null,
    whatsapp: (body.whatsapp as string)?.trim() || null,
    in_stock: body.inStock !== false,
    status: 'pending',
    university_id: profile?.university_id ?? null,
    created_at: new Date().toISOString(),
    views: 0,
  })

  return NextResponse.json(data, { status: 201 })
}
