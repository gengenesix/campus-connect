"use client"

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Campus Connect] Unhandled error:', error)
  }, [error])

  const isOffline = !navigator.onLine

  return (
    <div style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', background: '#f8f8f8',
    }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{
          border: '2px solid #111', background: '#fff', padding: '40px 32px',
          boxShadow: '6px 6px 0 #111',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {isOffline ? '📡' : '⚠️'}
          </div>
          <h1 style={{
            fontFamily: '"Archivo Black", sans-serif', fontSize: '22px',
            letterSpacing: '-0.5px', marginBottom: '12px', color: '#111',
          }}>
            {isOffline ? 'NO CONNECTION' : 'SOMETHING WENT WRONG'}
          </h1>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>
            {isOffline
              ? 'You appear to be offline. Check your internet connection and try again.'
              : 'An unexpected error occurred. This has been noted. Please try refreshing the page.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{
                padding: '12px 24px', background: '#1B5E20', color: '#fff',
                border: '2px solid #111', fontFamily: '"Archivo Black", sans-serif',
                fontSize: '13px', cursor: 'pointer', boxShadow: '3px 3px 0 #111',
                letterSpacing: '0.5px',
              }}
            >
              TRY AGAIN
            </button>
            <a
              href="/"
              style={{
                padding: '12px 24px', background: '#fff', color: '#111',
                border: '2px solid #111', fontFamily: '"Archivo Black", sans-serif',
                fontSize: '13px', textDecoration: 'none', display: 'inline-block',
                boxShadow: '3px 3px 0 #888', letterSpacing: '0.5px',
              }}
            >
              GO HOME
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
