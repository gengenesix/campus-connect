import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { inngest } from '@/lib/inngest'

const UpdateSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled']),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const { status } = parsed.data

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, client_id, provider_id, service_id')
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const isClient = booking.client_id === session.user.id
  const isProvider = booking.provider_id === session.user.id

  if (!isClient && !isProvider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Only provider can confirm/complete
  if ((status === 'confirmed' || status === 'completed') && !isProvider) {
    return NextResponse.json({ error: 'Only the provider can confirm or complete bookings' }, { status: 403 })
  }

  // Can only cancel pending/confirmed bookings
  if (status === 'cancelled' && !['pending', 'confirmed'].includes(booking.status)) {
    return NextResponse.json({ error: 'Cannot cancel a booking that is already completed or cancelled' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Emit events for downstream jobs
  if (status === 'confirmed') {
    void inngest.send({
      name: 'booking/confirmed',
      data: {
        bookingId: id,
        serviceId: booking.service_id,
        clientId: booking.client_id,
        providerId: booking.provider_id,
      },
    })
  }

  return NextResponse.json({ booking: updated })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, status, notes, scheduled_at, created_at, updated_at,
      service:services!service_id (id, name, rate, image_url, category, description),
      client:profiles!client_id (id, name, avatar_url),
      provider:profiles!provider_id (id, name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const booking = data as any
  if (booking.client?.id !== session.user.id && booking.provider?.id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ booking })
}
