import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */

// Parse R2 public URL for dynamic remotePatterns — safe if not set yet
const r2Hostname = (() => {
  const url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  if (!url) return null
  try { return new URL(url).hostname } catch { return null }
})()

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      // Cloudflare R2 public bucket (pub-*.r2.dev or custom domain)
      ...(r2Hostname ? [{ protocol: 'https', hostname: r2Hostname }] : []),
    ],
  },
  async headers() {
    // Build CSP img-src to include R2 if configured
    const r2Origin = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ''
    const imgSrcExtra = r2Origin ? ` ${r2Origin}` : ''

    return [
      // Service worker must never be cached so updates propagate immediately
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
      // Security headers on all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://*.googleusercontent.com${imgSrcExtra}`,
              // connect-src: allow R2 presigned PUT uploads + Supabase + Upstash
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://wa.me https://*.r2.cloudflarestorage.com${r2Origin ? ` ${r2Origin}` : ''} https://*.sentry.io https://sentry.io`,
              "worker-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      // Long-lived cache for static assets (immutable — fingerprinted by Next.js)
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache public images/fonts
      {
        source: '/(.*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2))',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      // University hub pages — 5 minute CDN cache
      {
        source: '/uni/:slug*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // Suppress Sentry CLI output during builds
  silent: true,

  // Upload source maps only when SENTRY_AUTH_TOKEN is present
  authToken: process.env.SENTRY_AUTH_TOKEN,

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Automatically instrument Next.js data fetching methods
  autoInstrumentServerFunctions: true,

  // Tree-shake Sentry logger to reduce bundle size
  disableLogger: true,

  // Don't fail the build if Sentry upload errors (e.g. missing auth token in dev)
  errorHandler(err, invokeErr, compilation) {
    compilation.warnings.push('Sentry CLI Plugin: ' + err.message)
  },
})
