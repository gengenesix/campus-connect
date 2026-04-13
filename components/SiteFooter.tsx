"use client"

import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '40px', paddingBottom: '32px', borderBottom: '1px solid #333' }}>
          <div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', color: '#fff', marginBottom: '12px' }}>
              CAMPUS<span style={{ color: '#a78bfa' }}>.</span>CONNECT
            </div>
            <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6 }}>
              The free peer-to-peer marketplace for UMaT students. No fees, no commissions.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '1px', color: '#666', marginBottom: '12px' }}>MARKETPLACE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[['Browse Goods', '/goods'], ['Services', '/services'], ['Sell an Item', '/sell'], ['Offer a Service', '/offer-service']].map(([label, href]) => (
                <Link key={href} href={href} style={{ color: '#999', fontSize: '14px', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#999')}
                >{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '1px', color: '#666', marginBottom: '12px' }}>ACCOUNT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[['Sign In', '/auth/login'], ['Create Account', '/auth/register'], ['Dashboard', '/dashboard'], ['My Listings', '/my-listings']].map(([label, href]) => (
                <Link key={href} href={href} style={{ color: '#999', fontSize: '14px', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#999')}
                >{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '1px', color: '#666', marginBottom: '12px' }}>SUPPORT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[['How It Works', '/about'], ['Safety Tips', '/about'], ['FAQ', '/about'], ['Contact Us', '/about']].map(([label, href]) => (
                <Link key={label} href={href} style={{ color: '#999', fontSize: '14px', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#999')}
                >{label}</Link>
              ))}
            </div>
          </div>
        </div>
        <div style={{ paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ color: '#555', fontSize: '13px' }}>© 2026 Campus Connect. UMaT, Tarkwa. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/about" style={{ color: '#555', fontSize: '13px', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/about" style={{ color: '#555', fontSize: '13px', textDecoration: 'none' }}>Terms</Link>
            <Link href="/about" style={{ color: '#555', fontSize: '13px', textDecoration: 'none' }}>Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
