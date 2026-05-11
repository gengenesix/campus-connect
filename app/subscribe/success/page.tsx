import Link from 'next/link'

export default function SubscribeSuccessPage() {
  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '480px', border: '3px solid #1B5E20', background: '#fff', boxShadow: '10px 10px 0 #1B5E20', padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', color: '#1B5E20' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px', color: '#1B5E20', letterSpacing: '-1px', marginBottom: '12px' }}>
          YOU'RE IN!
        </div>
        <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.7, marginBottom: '8px' }}>
          Your seller subscription is <strong>active for 30 days</strong>. You can now list goods and services on Campus Connect.
        </p>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '32px' }}>
          Your subscription will appear in your dashboard.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/sell"
            style={{ display: 'block', padding: '16px', background: '#1B5E20', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '15px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #111', letterSpacing: '0.5px' }}
          >
            LIST YOUR FIRST ITEM →
          </Link>
          <Link
            href="/offer-service"
            style={{ display: 'block', padding: '16px', background: '#fff', color: '#111', fontFamily: '"Archivo Black", sans-serif', fontSize: '15px', textDecoration: 'none', border: '2px solid #111', letterSpacing: '0.5px' }}
          >
            OFFER A SERVICE →
          </Link>
          <Link href="/dashboard" style={{ display: 'block', padding: '12px', color: '#888', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
