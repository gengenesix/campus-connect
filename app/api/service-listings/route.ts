import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getRateLimiter } from '@/lib/ratelimit'
import { indexService } from '@/lib/meilisearch'

const SERVICE_CATEGORIES = [
  'tutoring', 'design', 'tech', 'photography', 'writing',
  'transport', 'food', 'laundry', 'hair', 'printing', 'other',
] as const

const CreateServiceSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000),
  category: z.enum(SERVICE_CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) }),
  rate: z.string().trim().min(1, 'Rate is required').max(100),
  availability: z.string().trim().min(1, 'Availability is required').max(200),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  whatsapp: z.string().trim().max(20).optional().nullable(),
  additionalImages: z.array(z.string().url()).max(4).optional(),
})

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status })
}

// POST /api/service-listings — create a service listing (rate-limited: 5 per 10 minutes per user)
export async function POST(req: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────
    let supabase
    try {
      supabase = await createSupabaseServerClient()
    } catch (e: any) {
      console.error('[API /service-listings] Failed to create Supabase client:', e?.message)
      return err('Service unavailable — please try again.', 503)
    }

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      if (authError) console.warn('[API /service-listings] getUser error:', authError.message)
      return err('Unauthorized', 401)
    }
    const user = authData.user

    // ── Rate limiting ──────────────────────────────────────────
    const limiter = getRateLimiter(5, '10 m')
    if (limiter) {
      const { success, limit, remaining } = await limiter.limit(`svc:${user.id}`)
      if (!success) {
        return NextResponse.json(
          { error: "You're creating services too quickly. Wait a few minutes." },
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
    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return err('Invalid JSON body', 400)
    }

    const parsed = CreateServiceSchema.safeParse(rawBody)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return err(firstError?.message ?? 'Invalid request body', 400)
    }
    const { name, description, category, rate, availability, imageUrl, whatsapp, additionalImages } = parsed.data

    // ── Check sender is not banned ─────────────────────────────
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_banned, university_id, name, avatar_url, rating, is_verified, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (profileErr) {
      console.error('[API /service-listings] Profile fetch error:', profileErr.message)
      return err('Could not verify your account', 500)
    }
    if (profile?.is_banned) {
      return err('Your account has been suspended', 403)
    }

    const subExpiry = (profile as any)?.subscription_expires_at
    if (!subExpiry || new Date(subExpiry) <= new Date()) {
      return err('Active seller subscription required. Subscribe at /subscribe for GHS 20/month.', 403)
    }

    // ── Insert service ─────────────────────────────────────────
    const { data, error: insertError } = await supabase
      .from('services')
      .insert({
        provider_id: user.id,
        name,
        description,
        category,
        rate,
        availability,
        image_url: imageUrl ?? null,
        whatsapp: whatsapp?.trim() || null,
        status: 'pending',
        university_id: profile?.university_id ?? null,
      })
      .select('id')
      .single()

    // Save additional images (up to 4)
    if (!insertError && data?.id && additionalImages?.length) {
      await supabase.from('service_images').insert(
        additionalImages.map((url, i) => ({
          service_id: data.id,
          image_url: url,
          display_order: i,
        }))
      )
    }

    if (insertError) {
      console.error('[API /service-listings] Insert error:', insertError.message, insertError.code)
      if (insertError.code === '42501') {
        return err('Permission denied — you may not be authorised to create this listing.', 403)
      }
      return err(insertError.message, 500)
    }

    // Fire-and-forget: index to Meilisearch (status=pending, won't surface until approved)
    void indexService({
      id: data.id,
      provider_id: user.id,
      provider_name: profile?.name ?? null,
      provider_avatar_url: profile?.avatar_url ?? null,
      provider_rating: profile?.rating ?? 0,
      provider_verified: profile?.is_verified ?? false,
      provider: { name: profile?.name ?? null, avatar_url: profile?.avatar_url ?? null, rating: profile?.rating ?? 0, is_verified: profile?.is_verified ?? false },
      name,
      description,
      category,
      rate,
      availability,
      image_url: imageUrl ?? null,
      whatsapp: whatsapp?.trim() || null,
      status: 'pending',
      university_id: profile?.university_id ?? null,
      total_bookings: 0,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    console.error('[API /service-listings] Unhandled exception:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected server error — please try again.' },
      { status: 500 }
    )
  }
}
