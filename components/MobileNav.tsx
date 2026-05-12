"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconBrowse({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function IconMessages({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
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
        background: 'rgba(250, 250, 248, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid #E8E5E0',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {/* Left two tabs */}
      {NAV_ITEMS.slice(0, 2).map(item => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const href = !user && (item.href === '/messages' || item.href === '/dashboard')
          ? `/auth/login?redirect=${item.href}`
          : item.href
        return (
          <Link
            key={item.href}
            href={href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', flex: 1,
              padding: '10px 4px 10px', textDecoration: 'none',
              color: isActive ? '#1B5E20' : '#9A9590',
              minWidth: 0, minHeight: '56px',
              transition: 'color 0.2s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
            }}
          >
            {/* Active pill indicator */}
            {isActive && (
              <span style={{
                position: 'absolute', top: '8px',
                width: '32px', height: '32px',
                borderRadius: '10px',
                background: '#E8F5E9',
                zIndex: 0,
              }} />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>
              <item.Icon active={isActive} />
            </span>
            <span style={{
              fontSize: '10px', fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.2px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              color: isActive ? '#1B5E20' : '#9A9590',
              whiteSpace: 'nowrap', marginTop: '3px',
              position: 'relative', zIndex: 1,
            }}>
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
            width: '50px', height: '50px', borderRadius: '16px',
            background: '#1B5E20',
            boxShadow: '0 4px 14px rgba(27,94,32,0.35)',
            marginTop: '-18px', textDecoration: 'none',
            transition: 'transform 0.15s cubic-bezier(0.4,0,0.2,1), box-shadow 0.15s',
          }}
          onMouseDown={e => {
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(0.93)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(27,94,32,0.25)'
          }}
          onMouseUp={e => {
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(27,94,32,0.35)'
          }}
          onTouchStart={e => {
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(0.93)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(27,94,32,0.25)'
          }}
          onTouchEnd={e => {
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(27,94,32,0.35)'
          }}
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
        return (
          <Link
            key={item.href}
            href={href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', flex: 1,
              padding: '10px 4px 10px', textDecoration: 'none',
              color: isActive ? '#1B5E20' : '#9A9590',
              minWidth: 0, minHeight: '56px',
              transition: 'color 0.2s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute', top: '8px',
                width: '32px', height: '32px',
                borderRadius: '10px',
                background: '#E8F5E9',
                zIndex: 0,
              }} />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>
              <item.Icon active={isActive} />
            </span>
            <span style={{
              fontSize: '10px', fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.2px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              color: isActive ? '#1B5E20' : '#9A9590',
              whiteSpace: 'nowrap', marginTop: '3px',
              position: 'relative', zIndex: 1,
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}

      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav { display: flex !important; }
          body { padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }
        }
      `}</style>
    </nav>
  )
}
