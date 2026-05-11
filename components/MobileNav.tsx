"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
  { href: '/',         icon: '🏠', label: 'Home'     },
  { href: '/goods',    icon: '📦', label: 'Browse'   },
  { href: '/sell',     icon: '＋', label: 'Sell',  accent: true },
  { href: '/messages', icon: '💬', label: 'Messages' },
  { href: '/dashboard',icon: '👤', label: 'Profile'  },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Hide on auth pages
  if (pathname.startsWith('/auth/')) return null

  return (
    <nav style={{
      display: 'none',
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#111', borderTop: '3px solid #333',
      padding: '0',
    }}
    className="mobile-bottom-nav"
    >
      {NAV_ITEMS.map(item => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const href = !user && (item.href === '/messages' || item.href === '/dashboard' || item.href === '/wishlist')
          ? `/auth/login?redirect=${item.href}`
          : item.href

        return (
          <Link
            key={item.href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              padding: '10px 4px 8px',
              textDecoration: 'none',
              color: isActive ? (item.accent ? '#111' : '#a78bfa') : '#888',
              background: item.accent ? (isActive ? '#a78bfa' : '#1B5E20') : 'transparent',
              borderTop: isActive && !item.accent ? '3px solid #a78bfa' : '3px solid transparent',
              transition: 'all 0.15s',
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: item.accent ? '22px' : '20px', lineHeight: 1, marginBottom: '3px' }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.3px',
              fontFamily: '"Space Grotesk", sans-serif',
              color: item.accent ? '#fff' : (isActive ? '#a78bfa' : '#888'),
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}

      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex !important;
          }
          body {
            padding-bottom: 68px;
          }
        }
      `}</style>
    </nav>
  )
}
