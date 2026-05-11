import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const ReportSchema = z.object({
  productId:      z.string().uuid().optional(),
  serviceId:      z.string().uuid().optional(),
  reportedUserId: z.string().uuid().optional(),
  reason: z.enum(['spam', 'inappropriate', 'fraud', 'wrong_price', 'already_sold', 'other']),
  details: z.string().max(500).optional(),
})

// GET /api/reports — admin only, returns pending reports
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const session = { user }

  // Check admin role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ reports: [] })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const status = req.nextUrl.searchParams.get('status') ?? 'pending'

  const { data, error } = await admin
    .from('reports')
    .select(`
      id, reason, details, status, created_at,
      reporter:profiles!reporter_id (id, name),
      product:products!product_id (id, title),
      service:services!service_id (id, name),
      reported_user:profiles!reported_user_id (id, name)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reports: data ?? [] })
}

// PATCH /api/reports — admin resolve/dismiss a report
export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const session = { user }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status } = await req.json().catch(() => ({}))
  if (!id || !['resolved', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await admin.from('reports').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const session = { user }

  const body = await req.json().catch(() => null)
  const parsed = ReportSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })

  const { productId, serviceId, reportedUserId, reason, details } = parsed.data

  if (!productId && !serviceId && !reportedUserId) {
    return NextResponse.json({ error: 'Must provide productId, serviceId, or reportedUserId' }, { status: 400 })
  }

  // Prevent self-reporting
  if (reportedUserId && reportedUserId === session.user.id) {
    return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
  }

  // Prevent duplicate reports from same user for same item
  let dupQuery = supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', session.user.id)
    .eq('status', 'pending')

  if (productId) dupQuery = dupQuery.eq('product_id', productId)
  else if (serviceId) dupQuery = dupQuery.eq('service_id', serviceId)
  else if (reportedUserId) dupQuery = dupQuery.eq('reported_user_id', reportedUserId)

  const { data: dup } = await dupQuery.maybeSingle()
  if (dup) return NextResponse.json({ error: 'You already reported this — it is under review.' }, { status: 409 })

  const { error } = await supabase.from('reports').insert({
    reporter_id:      session.user.id,
    product_id:       productId ?? null,
    service_id:       serviceId ?? null,
    reported_user_id: reportedUserId ?? null,
    reason,
    details: details || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
