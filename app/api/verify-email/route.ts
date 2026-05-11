import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function getAuthUser(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, otp } = body

    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── SEND OTP ─────────────────────────────────────────────────────────────
    if (action === 'send') {
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }
      if (!email.toLowerCase().endsWith('.edu.gh')) {
        return NextResponse.json(
          { error: 'Only .edu.gh university email addresses are accepted' },
          { status: 400 }
        )
      }

      const code = generateOtp()
      const hash = hashOtp(code)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

      // Remove any existing OTPs for this user
      await getServiceClient().from('email_otps').delete().eq('user_id', user.id)

      // Store new OTP
      const { error: insertError } = await getServiceClient().from('email_otps').insert({
        user_id: user.id,
        email: email.toLowerCase(),
        otp_hash: hash,
        expires_at: expiresAt,
      })
      if (insertError) {
        return NextResponse.json({ error: 'Failed to create verification code' }, { status: 500 })
      }

      // Send via Resend if configured
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'Campus Connect <noreply@campusconnect.gh>',
          to: email,
          subject: 'Your Campus Connect verification code',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
              <h2 style="color:#111;font-size:24px;margin-bottom:8px;">Verify your university email</h2>
              <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;">
                Enter this 6-digit code on Campus Connect to verify your .edu.gh address:
              </p>
              <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#1B5E20;background:#f8f8f8;border:2px solid #111;padding:24px;text-align:center;margin-bottom:24px;">
                ${code}
              </div>
              <p style="color:#999;font-size:12px;">
                This code expires in 15 minutes. If you didn't request this, you can safely ignore it.
              </p>
            </div>
          `,
        })
      } else {
        // Dev: print to console
        console.log(`[DEV] Email OTP for ${email}: ${code}`)
      }

      return NextResponse.json({
        ok: true,
        // Only expose code in development to aid testing
        ...(process.env.NODE_ENV === 'development' ? { devCode: code } : {}),
      })
    }

    // ── CONFIRM OTP ───────────────────────────────────────────────────────────
    if (action === 'confirm') {
      if (!email || !otp || typeof otp !== 'string') {
        return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
      }
      if (!/^\d{6}$/.test(otp)) {
        return NextResponse.json({ error: 'Enter the 6-digit code exactly as received' }, { status: 400 })
      }

      const hash = hashOtp(otp)

      const { data: otpRow } = await getServiceClient()
        .from('email_otps')
        .select('id, expires_at, used')
        .eq('user_id', user.id)
        .eq('email', email.toLowerCase())
        .eq('otp_hash', hash)
        .eq('used', false)
        .single()

      if (!otpRow) {
        return NextResponse.json({ error: 'Invalid or expired code. Request a new one.' }, { status: 400 })
      }
      if (new Date(otpRow.expires_at) < new Date()) {
        return NextResponse.json({ error: 'This code has expired. Request a new one.' }, { status: 400 })
      }

      // Consume the OTP
      await getServiceClient().from('email_otps').update({ used: true }).eq('id', otpRow.id)

      // Update profile
      const { error: updateError } = await getServiceClient()
        .from('profiles')
        .update({ university_email: email.toLowerCase(), university_email_verified: true })
        .eq('id', user.id)

      if (updateError) {
        return NextResponse.json({ error: 'Verification passed but profile update failed. Contact support.' }, { status: 500 })
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('[verify-email]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
