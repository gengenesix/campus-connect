import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'
import { getRateLimiter } from '@/lib/ratelimit'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_FOLDERS = ['products', 'services', 'avatars']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

// POST /api/upload — returns a presigned R2 PUT URL + the future public URL.
// The client uploads the file directly to R2 (bypasses our server).
// Rate-limited: 10 uploads per hour per user.
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit by user ID
  const limiter = getRateLimiter(10, '1 h')
  if (limiter) {
    const { success } = await limiter.limit(`upload:${user.id}`)
    if (!success) {
      return NextResponse.json(
        { error: 'Upload limit reached. Please wait before uploading more images.' },
        { status: 429 }
      )
    }
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { contentType, folder, fileSize } = body as {
    contentType?: string
    folder?: string
    fileSize?: number
  }

  if (!ALLOWED_TYPES.includes(contentType ?? '')) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPG, PNG and WebP are allowed.' },
      { status: 400 }
    )
  }
  if (!ALLOWED_FOLDERS.includes(folder ?? '')) {
    return NextResponse.json({ error: 'Invalid upload folder.' }, { status: 400 })
  }
  if (!fileSize || fileSize > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File too large. Maximum 5MB.' },
      { status: 400 }
    )
  }

  // e.g. products/user-id/1748000000000.jpg
  const ext = (contentType as string).split('/')[1].replace('jpeg', 'jpg')
  const key = `${folder}/${user.id}/${Date.now()}.${ext}`

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType as string,
      ContentLength: fileSize,
    })

    // Presigned URL valid for 2 minutes — enough for mobile uploads on slow networks
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 120 })
    const publicUrl = `${R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (err: any) {
    console.error('[upload] R2 presign error:', err?.message)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
