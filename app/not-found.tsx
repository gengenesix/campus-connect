import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Page Not Found | Campus Connect',
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: '#f8f8f8',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: '"Syne", sans-serif',
          fontSize: 'clamp(80px, 20vw, 160px)',
          lineHeight: 1,
          color: '#111',
          letterSpacing: '-4px',
          marginBottom: '8px',
        }}
      >
        404
      </div>
      <div
        style={{
          fontFamily: '"Syne", sans-serif',
          fontSize: '22px',
          marginBottom: '12px',
          letterSpacing: '-0.5px',
        }}
      >
        PAGE NOT FOUND
      </div>
      <p style={{ color: '#888', maxWidth: '380px', lineHeight: 1.7, marginBottom: '36px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        The listing, page, or resource you were looking for doesn't exist or has been removed.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            padding: '14px 32px',
            background: '#111',
            color: '#fff',
            fontFamily: '"Syne", sans-serif',
            fontSize: '14px',
            textDecoration: 'none',
            border: '2px solid #111',
            boxShadow: '4px 4px 0 #888',
            letterSpacing: '0.5px',
          }}
        >
          ← HOME
        </Link>
        <Link
          href="/goods"
          style={{
            padding: '14px 32px',
            background: '#1B5E20',
            color: '#fff',
            fontFamily: '"Syne", sans-serif',
            fontSize: '14px',
            textDecoration: 'none',
            border: '2px solid #111',
            boxShadow: '4px 4px 0 #888',
            letterSpacing: '0.5px',
          }}
        >
          BROWSE GOODS →
        </Link>
        <Link
          href="/services"
          style={{
            padding: '14px 32px',
            background: '#fff',
            color: '#111',
            fontFamily: '"Syne", sans-serif',
            fontSize: '14px',
            textDecoration: 'none',
            border: '2px solid #111',
            boxShadow: '4px 4px 0 #888',
            letterSpacing: '0.5px',
          }}
        >
          BROWSE SERVICES
        </Link>
      </div>
    </div>
  )
}
