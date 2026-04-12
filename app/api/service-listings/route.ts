import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getRateLimiter } from '@/lib/ratelimit'

// POST /api/service-listings — create a service listing (rate-limited: 5 per 10 minutes per user)
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting via Upstash (gracefully skipped if not configured)
  const limiter = getRateLimiter(5, '10 m')
  if (limiter) {
    const { success } = await limiter.limit(`svc:${user.id}`)
    if (!success) {
      return NextResponse.json(
        { error: 'You\'re creating services too quickly. Wait a few minutes.' },
        { status: 429 }
      )
    }
  }

  const body = await req.json()
  const { name, description, category, rate, availability, imageUrl, whatsapp } = body

  if (!name?.trim() || !category || !rate?.trim() || !description?.trim() || !availability?.trim()) {
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
    .from('services')
    .insert({
      provider_id: user.id,
      name: name.trim(),
      description: description.trim(),
      category,
      rate: rate.trim(),
      availability: availability.trim(),
      image_url: imageUrl ?? null,
      whatsapp: whatsapp?.trim() || null,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
