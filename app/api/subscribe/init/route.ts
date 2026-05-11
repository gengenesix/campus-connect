import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function getAuthUser(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list) {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// POST /api/subscribe/init
// Initialises a Paystack transaction for the GHS 20/month seller subscription.
// Returns { authorization_url } which the client redirects to.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Dev bypass (no Paystack key) ───────────────────────────────────────
    if (!process.env.PAYSTACK_SECRET_KEY) {
      if (process.env.NODE_ENV === 'development') {
        // Activate subscription directly in dev
        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        await serviceSupabase
          .from('profiles')
          .update({ subscription_expires_at: newExpiry })
          .eq('id', user.id)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
        return NextResponse.json({ authorization_url: `${siteUrl}/subscribe/success` })
      }
      return NextResponse.json({ error: 'Payment is not configured yet.' }, { status: 503 })
    }

    // ── Generate unique reference ──────────────────────────────────────────
    const reference = `CC_SUB_${user.id.slice(0, 8)}_${crypto.randomBytes(6).toString('hex').toUpperCase()}`

    // ── Create pending subscription row ───────────────────────────────────
    await serviceSupabase.from('subscriptions').insert({
      user_id: user.id,
      status: 'pending',
      paystack_ref: reference,
      amount: 2000,
    })

    // ── Call Paystack initialize ───────────────────────────────────────────
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://campusconnect.gh'
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: 2000,          // GHS 20 in pesewas
        currency: 'GHS',
        reference,
        callback_url: `${siteUrl}/api/subscribe/callback`,
        metadata: {
          cancel_action: `${siteUrl}/subscribe`,
          custom_fields: [
            { display_name: 'Platform', variable_name: 'platform', value: 'Campus Connect' },
            { display_name: 'Plan', variable_name: 'plan', value: 'Seller — GHS 20/month' },
          ],
        },
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[subscribe/init] Paystack error:', text)
      return NextResponse.json({ error: 'Payment service unavailable. Try again.' }, { status: 502 })
    }

    const json = await res.json()
    return NextResponse.json({ authorization_url: json.data.authorization_url })
  } catch (err: any) {
    console.error('[subscribe/init]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
