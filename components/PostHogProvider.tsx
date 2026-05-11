"use client"

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

/**
 * PostHog analytics provider.
 * Initialises PostHog once and tracks page views on route changes.
 * Set NEXT_PUBLIC_POSTHOG_KEY in env — no-ops gracefully if absent.
 */
export default function PostHogProvider() {
  const pathname   = usePathname()
  const searchParams = useSearchParams()
  const initiated  = useRef(false)

  useEffect(() => {
    const key  = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
    if (!key || initiated.current) return

    posthog.init(key, {
      api_host: host,
      capture_pageview: false,   // we capture manually for SPA navigation
      capture_pageleave: true,
      persistence: 'localStorage',
      autocapture: false,        // manual control — avoids capturing sensitive inputs
    })
    initiated.current = true
  }, [])

  // Track page views on every client-side navigation
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || !pathname) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}
