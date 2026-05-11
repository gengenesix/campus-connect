import webpush from 'web-push'

/**
 * Lazy-initialise web-push with VAPID keys.
 * Required env vars:
 *   VAPID_PUBLIC_KEY   — from: npx web-push generate-vapid-keys
 *   VAPID_PRIVATE_KEY  — from: npx web-push generate-vapid-keys
 *   VAPID_SUBJECT      — e.g. mailto:hello@campusconnect.edu.gh
 */
let configured = false

function configureVapid() {
  if (configured) return
  const pub = process.env.VAPID_PUBLIC_KEY
  const prv = process.env.VAPID_PRIVATE_KEY
  const sub = process.env.VAPID_SUBJECT ?? 'mailto:hello@campusconnect.edu.gh'
  if (!pub || !prv) return
  webpush.setVapidDetails(sub, pub, prv)
  configured = true
}

export interface PushSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/**
 * Send a Web Push notification to a single subscription.
 * Returns true on success, false on failure (expired/invalid sub should be deleted by caller).
 */
export async function sendPush(
  subscription: PushSubscription,
  payload: { title: string; body: string; url?: string; icon?: string }
): Promise<boolean> {
  configureVapid()
  if (!configured) {
    console.warn('[webpush] VAPID keys not set — push skipped')
    return false
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return true
  } catch (err: any) {
    // 410 Gone = subscription expired; caller should clean it up
    if (err?.statusCode === 410 || err?.statusCode === 404) return false
    console.error('[webpush] sendNotification error:', err?.message)
    return false
  }
}
