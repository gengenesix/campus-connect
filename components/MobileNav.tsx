"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconBrowse({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function IconMessages({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/',          label: 'Home',     Icon: IconHome },
  { href: '/goods',     label: 'Browse',   Icon: IconBrowse },
  { href: '/messages',  label: 'Messages', Icon: IconMessages },
  { href: '/dashboard', label: 'Profile',  Icon: IconProfile },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (pathname.startsWith('/auth/')) return null

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: '#111', borderTop: '2px solid #222',
      }}
    >
      {/* Left two tabs */}
      {NAV_ITEMS.slice(0, 2).map(item => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const href = !user && (item.href === '/messages' || item.href === '/dashboard')
          ? `/auth/login?redirect=${item.href}`
          : item.href
        const color = isActive ? '#a78bfa' : '#666'
        return (
          <Link key={item.href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '10px 4px 8px', textDecoration: 'none', color, borderTop: isActive ? '2px solid #a78bfa' : '2px solid transparent', transition: 'all 0.15s', minWidth: 0 }}>
            <item.Icon active={isActive} />
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px', fontFamily: '"Space Grotesk", sans-serif', color, whiteSpace: 'nowrap', marginTop: '3px' }}>
              {item.label}
            </span>
          </Link>
        )
      })}

      {/* Center Sell FAB */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '0 4px', position: 'relative' }}>
        <Link
          href="/sell"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#1B5E20', border: '3px solid #111',
            boxShadow: '0 -4px 16px rgba(27,94,32,0.4)',
            marginTop: '-20px', textDecoration: 'none', transition: 'transform 0.15s',
          }}
          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.93)' }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
          onTouchStart={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.93)' }}
          onTouchEnd={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
        >
          <IconPlus />
        </Link>
      </div>

      {/* Right two tabs */}
      {NAV_ITEMS.slice(2).map(item => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const href = !user && (item.href === '/messages' || item.href === '/dashboard')
          ? `/auth/login?redirect=${item.href}`
          : item.href
        const color = isActive ? '#a78bfa' : '#666'
        return (
          <Link key={item.href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '10px 4px 8px', textDecoration: 'none', color, borderTop: isActive ? '2px solid #a78bfa' : '2px solid transparent', transition: 'all 0.15s', minWidth: 0 }}>
            <item.Icon active={isActive} />
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px', fontFamily: '"Space Grotesk", sans-serif', color, whiteSpace: 'nowrap', marginTop: '3px' }}>
              {item.label}
            </span>
          </Link>
        )
      })}

      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav { display: flex !important; }
          body { padding-bottom: 68px; }
        }
      `}</style>
    </nav>
  )
}
