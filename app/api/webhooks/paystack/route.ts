import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST /api/webhooks/paystack
// Backup confirmation from Paystack when payment completes.
// Configure in Paystack dashboard → Settings → API Keys & Webhooks.
export async function POST(request: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ ok: true }) // not configured

  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature') ?? ''

  // Verify HMAC-SHA512 signature
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  if (expected !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ ok: true }) // ignore other events
  }

  const reference = event.data?.reference
  if (!reference || !reference.startsWith('CC_SUB_')) {
    return NextResponse.json({ ok: true }) // not our subscription payment
  }

  // Look up subscription
  const { data: sub } = await getServiceClient()
    .from('subscriptions')
    .select('id, user_id, status')
    .eq('paystack_ref', reference)
    .single()

  if (!sub || sub.status === 'active') {
    return NextResponse.json({ ok: true }) // already handled or unknown
  }

  // Verify amount and currency
  if (event.data.currency !== 'GHS' || event.data.amount < 2000) {
    return NextResponse.json({ ok: true })
  }

  // Activate subscription
  const currentExpiry = null // fetch fresh
  const { data: prof } = await getServiceClient()
    .from('profiles')
    .select('subscription_expires_at')
    .eq('id', sub.user_id)
    .single()

  const base = prof?.subscription_expires_at && new Date(prof.subscription_expires_at) > new Date()
    ? new Date(prof.subscription_expires_at)
    : new Date()
  const newExpiry = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000)

  const db = getServiceClient()
  await Promise.all([
    db
      .from('profiles')
      .update({ subscription_expires_at: newExpiry.toISOString() })
      .eq('id', sub.user_id),
    db
      .from('subscriptions')
      .update({ status: 'active', starts_at: new Date().toISOString(), ends_at: newExpiry.toISOString() })
      .eq('paystack_ref', reference),
  ])

  return NextResponse.json({ ok: true })
}
