import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}

// GET /api/reviews?product=<id>  OR  ?service=<id>  OR  ?target=<userId>
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const productId = searchParams.get('product')
  const serviceId = searchParams.get('service')
  const targetId  = searchParams.get('target')

  const supabase = await createClient()

  let query = supabase
    .from('reviews')
    .select(`
      id, rating, comment, created_at,
      reviewer:profiles!reviewer_id (id, name, avatar_url, is_verified)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (productId) query = query.eq('product_id', productId)
  else if (serviceId) query = query.eq('service_id', serviceId)
  else if (targetId) query = query.eq('reviewee_id', targetId)
  else return NextResponse.json({ error: 'Missing filter param' }, { status: 400 })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reviews: data ?? [] })
}

const ReviewSchema = z.object({
  reviewee_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  product_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
})

// POST /api/reviews — create a review (auth required)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = ReviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 })

  const { reviewee_id, rating, comment, product_id, service_id } = parsed.data

  if (user.id === reviewee_id) {
    return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
  }

  // Check for duplicate review on same product/service
  const dupCheck = supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', user.id)
    .eq('reviewee_id', reviewee_id)

  if (product_id) dupCheck.eq('product_id', product_id)
  else if (service_id) dupCheck.eq('service_id', service_id)

  const { data: existing } = await dupCheck.maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this listing' }, { status: 409 })
  }

  const { data, error } = await supabase.from('reviews').insert({
    reviewer_id: user.id,
    reviewee_id,
    rating,
    comment: comment ?? null,
    product_id: product_id ?? null,
    service_id: service_id ?? null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
