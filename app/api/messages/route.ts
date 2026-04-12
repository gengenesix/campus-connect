import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getRateLimiter } from '@/lib/ratelimit'

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

  const body = await req.json()
  const { receiverId, content, productId } = body

  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: 'receiverId and content are required' }, { status: 400 })
  }

  // Block sending to yourself
  if (receiverId === user.id) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
  }

  const insertPayload: Record<string, unknown> = {
    sender_id: user.id,
    receiver_id: receiverId,
    content: content.trim(),
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
