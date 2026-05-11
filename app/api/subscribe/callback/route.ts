import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://campusconnect.gh'

async function activateSubscription(userId: string, reference: string) {
  // Extend from current expiry if still active, otherwise from now
  const { data: prof } = await serviceSupabase
    .from('profiles')
    .select('subscription_expires_at')
    .eq('id', userId)
    .single()

  const currentExpiry = prof?.subscription_expires_at
  const base = currentExpiry && new Date(currentExpiry) > new Date()
    ? new Date(currentExpiry)
    : new Date()
  const newExpiry = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000)

  await Promise.all([
    serviceSupabase
      .from('profiles')
      .update({ subscription_expires_at: newExpiry.toISOString() })
      .eq('id', userId),
    serviceSupabase
      .from('subscriptions')
      .update({ status: 'active', starts_at: new Date().toISOString(), ends_at: newExpiry.toISOString() })
      .eq('paystack_ref', reference),
  ])
}

// GET /api/subscribe/callback?reference=xxx
// Paystack redirects here after payment. Verifies and activates subscription.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get('reference') ?? request.nextUrl.searchParams.get('trxref')

  if (!reference) {
    return NextResponse.redirect(`${SITE_URL}/subscribe?error=missing_reference`)
  }

  // Look up pending subscription to get user_id
  const { data: sub } = await serviceSupabase
    .from('subscriptions')
    .select('id, user_id, status')
    .eq('paystack_ref', reference)
    .single()

  if (!sub) {
    return NextResponse.redirect(`${SITE_URL}/subscribe?error=unknown_reference`)
  }

  // Already activated (e.g. webhook beat us here)
  if (sub.status === 'active') {
    return NextResponse.redirect(`${SITE_URL}/subscribe/success`)
  }

  // Verify with Paystack
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })

  if (!res.ok) {
    return NextResponse.redirect(`${SITE_URL}/subscribe?error=verification_failed`)
  }

  const json = await res.json()
  const tx = json.data

  if (tx.status !== 'success') {
    await serviceSupabase.from('subscriptions').update({ status: 'failed' }).eq('paystack_ref', reference)
    return NextResponse.redirect(`${SITE_URL}/subscribe?error=payment_failed`)
  }

  // Validate amount (2000 pesewas = GHS 20) and currency
  if (tx.currency !== 'GHS' || tx.amount < 2000) {
    return NextResponse.redirect(`${SITE_URL}/subscribe?error=invalid_amount`)
  }

  await activateSubscription(sub.user_id, reference)
  return NextResponse.redirect(`${SITE_URL}/subscribe/success`)
}
