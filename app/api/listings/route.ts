import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getRateLimiter } from '@/lib/ratelimit'

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

  // Verify user is not banned
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .single()

  if (profile?.is_banned) {
    return NextResponse.json({ error: 'Account is suspended' }, { status: 403 })
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
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
