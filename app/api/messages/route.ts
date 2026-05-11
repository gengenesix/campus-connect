import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getRateLimiter } from '@/lib/ratelimit'
import { inngest } from '@/lib/inngest'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_CONTENT = 2000

function isValidUUID(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status })
}

// POST /api/messages — send a message (rate-limited: 30 per minute per user)
export async function POST(req: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────
    let supabase
    try {
      supabase = await createSupabaseServerClient()
    } catch (e: any) {
      console.error('[API /messages] Failed to create Supabase client:', e?.message)
      return err('Service unavailable — please try again.', 503)
    }

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      if (authError) console.warn('[API /messages] getUser error:', authError.message)
      return err('Unauthorized', 401)
    }
    const user = authData.user

    // ── Rate limiting ─────────────────────────────────────────
    const limiter = getRateLimiter(30, '1 m')
    if (limiter) {
      const { success, limit, remaining } = await limiter.limit(`msg:${user.id}`)
      if (!success) {
        return NextResponse.json(
          { error: 'Too many messages — slow down a bit.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
            },
          }
        )
      }
    }

    // ── Parse & validate body ──────────────────────────────────
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return err('Invalid JSON body', 400)
    }

    const { receiverId, content, productId } = body

    if (!isValidUUID(receiverId)) {
      return err('Invalid or missing receiverId', 400)
    }
    if (typeof content !== 'string' || !content.trim()) {
      return err('Message content is required', 400)
    }

    const cleanContent = content.replace(/\0/g, '').trim()
    if (cleanContent.length === 0) return err('Message cannot be empty', 400)
    if (cleanContent.length > MAX_CONTENT) {
      return err(`Message too long (max ${MAX_CONTENT} characters)`, 400)
    }
    if (productId !== undefined && productId !== null && !isValidUUID(productId)) {
      return err('Invalid productId', 400)
    }
    if (receiverId === user.id) {
      return err('Cannot message yourself', 400)
    }

    // ── Check sender is not banned ─────────────────────────────
    const { data: senderProfile, error: senderErr } = await supabase
      .from('profiles')
      .select('is_banned')
      .eq('id', user.id)
      .single()

    if (senderErr) {
      console.error('[API /messages] Sender profile fetch error:', senderErr.message)
      return err('Could not verify sender profile', 500)
    }
    if (senderProfile?.is_banned) {
      return err('Your account has been suspended', 403)
    }

    // ── Check receiver exists ──────────────────────────────────
    const { data: receiverProfile, error: receiverErr } = await supabase
      .from('profiles')
      .select('id, is_banned')
      .eq('id', receiverId)
      .single()

    if (receiverErr || !receiverProfile) {
      const code = (receiverErr as any)?.code
      // PGRST116 = no rows found (.single() with no match)
      if (code === 'PGRST116' || !receiverProfile) {
        return err('Recipient not found', 404)
      }
      console.error('[API /messages] Receiver fetch error:', (receiverErr as any)?.message)
      return err('Could not verify recipient', 500)
    }
    if (receiverProfile.is_banned) {
      return err('Cannot message this user', 403)
    }

    // ── Insert message ─────────────────────────────────────────
    const insertPayload: Record<string, unknown> = {
      sender_id: user.id,
      receiver_id: receiverId,
      content: cleanContent,
    }
    if (productId) insertPayload.product_id = productId

    const { data, error: insertError } = await supabase
      .from('messages')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      console.error('[API /messages] Insert error:', insertError.message, insertError.code)
      // Surface a friendlier message for RLS violations
      if (insertError.code === '42501') {
        return err('Permission denied — you may not be authorised to send this message.', 403)
      }
      return err(insertError.message, 500)
    }

    if (!data) {
      console.error('[API /messages] Insert returned no data (silent RLS block?)')
      return err('Message could not be saved — please try again.', 500)
    }

    // Fire-and-forget: trigger Inngest job for notification + email
    void inngest.send({
      name: 'message/sent',
      data: {
        messageId: data.id,
        senderId: user.id,
        receiverId,
        productId: productId ?? null,
        contentPreview: cleanContent.slice(0, 200),
      },
    })

    return NextResponse.json(data)
  } catch (e: any) {
    // Last-resort catch — always return { error } so the client can display it
    console.error('[API /messages] Unhandled exception:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected server error — please try again.' },
      { status: 500 }
    )
  }
}
