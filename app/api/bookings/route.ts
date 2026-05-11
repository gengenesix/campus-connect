import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { inngest } from '@/lib/inngest'

const BookingSchema = z.object({
  service_id: z.string().uuid(),
  notes: z.string().max(1000).optional(),
  scheduled_at: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const session = { user }

  const body = await req.json().catch(() => null)
  const parsed = BookingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })

  const { service_id, notes, scheduled_at } = parsed.data

  // Fetch service + provider
  const { data: service, error: serviceErr } = await supabase
    .from('services')
    .select('id, name, provider_id, rate, image_url, university_id, provider:profiles!provider_id (id, name)')
    .eq('id', service_id)
    .neq('status', 'deleted')
    .single()

  if (serviceErr || !service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  const providerData = service.provider as any
  if (providerData?.id === session.user.id) {
    return NextResponse.json({ error: 'You cannot book your own service' }, { status: 400 })
  }

  // Check for existing pending/confirmed booking for this service by this client
  const { data: existing } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('service_id', service_id)
    .eq('client_id', session.user.id)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You already have an active booking for this service', bookingId: existing.id }, { status: 409 })
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      service_id,
      client_id: session.user.id,
      provider_id: providerData?.id,
      university_id: (service as any).university_id ?? null,
      notes: notes || null,
      scheduled_at: scheduled_at || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify provider (fire-and-forget)
  void inngest.send({
    name: 'booking/requested',
    data: {
      bookingId: booking.id,
      serviceId: service_id,
      serviceName: (service as any).name,
      clientId: session.user.id,
      providerId: providerData?.id,
    },
  })

  return NextResponse.json({ booking }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const session = { user }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') // 'client' | 'provider'
  const status = searchParams.get('status')

  let query = supabase
    .from('bookings')
    .select(`
      id, status, notes, scheduled_at, created_at, updated_at,
      service:services!service_id (id, name, rate, image_url, category),
      client:profiles!client_id (id, name, avatar_url),
      provider:profiles!provider_id (id, name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (role === 'client') {
    query = query.eq('client_id', session.user.id)
  } else if (role === 'provider') {
    query = query.eq('provider_id', session.user.id)
  } else {
    query = query.or(`client_id.eq.${session.user.id},provider_id.eq.${session.user.id}`)
  }

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bookings: data ?? [] })
}
