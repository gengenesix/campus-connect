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
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  const redis = new Redis({ url, token })
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
    prefix: 'campus:rl',
  })
}
