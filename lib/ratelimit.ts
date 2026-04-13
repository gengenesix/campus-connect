import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Returns a sliding-window rate limiter if Upstash is configured,
 * or null for graceful degradation when env vars are absent.
 *
 * Setup: add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * to your .env.local / Vercel environment variables.
 */
export function getRateLimiter(requests: number, window: `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`) {
  // Strip any accidental surrounding quotes (e.g. from Vercel copy-paste: ""https://..."")
  const raw = (v: string | undefined) => v?.replace(/^["']+|["']+$/g, '').trim()

  const url   = raw(process.env.UPSTASH_REDIS_REST_URL)
  const token = raw(process.env.UPSTASH_REDIS_REST_TOKEN)

  if (!url || !token) return null

  try {
    const redis = new Redis({ url, token })
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: false,
      prefix: 'campus:rl',
    })
  } catch (e: any) {
    console.warn('[ratelimit] Failed to initialise Upstash — rate limiting disabled:', e?.message)
    return null
  }
}
