import { Redis } from '@upstash/redis'

/**
 * Lightweight Redis cache wrapper.
 * Gracefully no-ops if UPSTASH_REDIS_REST_URL / TOKEN are not set.
 * Shares the same Redis connection as the rate limiter.
 */
let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  const raw = (v: string | undefined) => v?.replace(/^["']+|["']+$/g, '').trim()
  const url   = raw(process.env.UPSTASH_REDIS_REST_URL)
  const token = raw(process.env.UPSTASH_REDIS_REST_TOKEN)
  if (!url || !token) return null
  try {
    _redis = new Redis({ url, token })
    return _redis
  } catch {
    return null
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis()
  if (!r) return null
  try { return await r.get<T>(key) } catch { return null }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis()
  if (!r) return
  try { await r.set(key, value, { ex: ttlSeconds }) } catch {}
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    if (keys.length === 1) await r.del(keys[0])
    else await r.del(...keys as [string, ...string[]])
  } catch {}
}
