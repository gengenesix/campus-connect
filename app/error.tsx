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
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', color: isOffline ? '#5d3fd3' : '#f59e0b' }}>
            {isOffline ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            )}
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
