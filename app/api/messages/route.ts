import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getRateLimiter } from '@/lib/ratelimit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_CONTENT = 2000

function isValidUUID(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

// POST /api/messages — send a message (rate-limited: 30 per minute per user)
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting via Upstash (gracefully skipped if not configured)
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

  // ── Parse & validate body ─────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { receiverId, content, productId } = body

  if (!isValidUUID(receiverId)) {
    return NextResponse.json({ error: 'Invalid receiverId' }, { status: 400 })
  }

  if (typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  // Strip null bytes and control characters, enforce max length
  const cleanContent = content.replace(/\0/g, '').trim()
  if (cleanContent.length === 0) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }
  if (cleanContent.length > MAX_CONTENT) {
    return NextResponse.json(
      { error: `Message too long (max ${MAX_CONTENT} characters)` },
      { status: 400 }
    )
  }

  if (productId !== undefined && productId !== null && !isValidUUID(productId)) {
    return NextResponse.json({ error: 'Invalid productId' }, { status: 400 })
  }

  // ── Block self-messaging ──────────────────────────────────
  if (receiverId === user.id) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
  }

  // ── Check sender is not banned ────────────────────────────
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .single()

  if (senderProfile?.is_banned) {
    return NextResponse.json({ error: 'Your account has been suspended' }, { status: 403 })
  }

  // ── Check receiver exists and is not banned ───────────────
  const { data: receiverProfile, error: receiverErr } = await supabase
    .from('profiles')
    .select('id, is_banned')
    .eq('id', receiverId)
    .single()

  if (receiverErr || !receiverProfile) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
  }
  if (receiverProfile.is_banned) {
    return NextResponse.json({ error: 'Cannot message this user' }, { status: 403 })
  }

  // ── Insert message ────────────────────────────────────────
  const insertPayload: Record<string, unknown> = {
    sender_id: user.id,
    receiver_id: receiverId,
    content: cleanContent,
  }
  if (productId) insertPayload.product_id = productId

  const { data, error } = await supabase
    .from('messages')
    .insert(insertPayload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
