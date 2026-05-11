"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from './NotificationBell'

interface InstantHit {
  id: string
  title?: string   // products
  name?: string    // services
  price?: number
  category?: string
  image_url?: string | null
  type: 'product' | 'service'
}

export default function SiteNav() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [instantHits, setInstantHits] = useState<InstantHit[]>([])
  const [instantLoading, setInstantLoading] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut, loading } = useAuth()

  // Instant search: debounced fetch as user types
  useEffect(() => {
    if (!searchOpen) { setInstantHits([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = searchQuery.trim()
    if (!q) { setInstantHits([]); return }

    setInstantLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const [prodRes, svcRes] = await Promise.all([
          fetch(`/api/search?q=${encodeURIComponent(q)}&type=products&limit=5`),
          fetch(`/api/search?q=${encodeURIComponent(q)}&type=services&limit=3`),
        ])
        const [prodJson, svcJson] = await Promise.all([prodRes.json(), svcRes.json()])
        const products: InstantHit[] = (prodJson.hits ?? []).map((h: any) => ({ ...h, type: 'product' as const }))
        const services: InstantHit[] = (svcJson.hits ?? []).map((h: any) => ({ ...h, type: 'service' as const }))
        setInstantHits([...products, ...services])
      } catch {}
      finally { setInstantLoading(false) }
    }, 280)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery, searchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/goods?q=${encodeURIComponent(searchQuery.trim())}`)
    }
    setSearchOpen(false)
    setSearchQuery('')
    setInstantHits([])
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setInstantHits([])
  }

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
    router.push('/')
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const navLinks = [
    { href: '/#universities', label: 'UNIVERSITIES' },
    { href: '/goods', label: 'BROWSE GOODS' },
    { href: '/services', label: 'SERVICES' },
    { href: '/sell', label: 'SELL' },
  ]

  return (
    <>
      {/* Top Marquee Bar */}
      <div className="marquee-bar">
        <div className="marquee-container">
          <div className="marquee-content">
            100% FREE &bull; NO COMMISSION &bull; 43 GHANA UNIVERSITIES &bull; BUY &amp; SELL GOODS &bull; BOOK CAMPUS SERVICES &bull; PEER-TO-PEER MARKETPLACE &bull;&nbsp;
            100% FREE &bull; NO COMMISSION &bull; 43 GHANA UNIVERSITIES &bull; BUY &amp; SELL GOODS &bull; BOOK CAMPUS SERVICES &bull; PEER-TO-PEER MARKETPLACE &bull;
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="navigation" style={{ borderBottom: '2px solid #eee' }}>
        <div className="logo">
          <Link href="/">
            CAMPUS<span>.</span>CONNECT
          </Link>
          <div className="beta-badge">BETA</div>
        </div>

        <div className="nav-links">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${pathname?.startsWith(link.href) ? ' nav-link-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <div
            className="nav-icon"
            onClick={() => { if (searchOpen) closeSearch(); else setSearchOpen(true) }}
            style={{ cursor: 'pointer' }}
            aria-label="Search"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {user && (
            <>
              <Link href="/messages" className="nav-icon" aria-label="Messages">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </Link>
              <NotificationBell />
            </>
          )}

          {!loading && (
            user ? (
              <>
                <Link href="/sell" className="nav-sell-btn">
                  + SELL
                </Link>

                {/* User Avatar + Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'none', border: '2px solid #111', padding: '6px 12px 6px 6px',
                      cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif',
                    }}
                    aria-label="User menu"
                  >
                    {profile?.avatar_url ? (
                      <Image src={profile.avatar_url} alt={profile.name ?? ''} width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover' }} unoptimized />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px' }}>
                        {initials}
                      </div>
                    )}
                    <span style={{ fontSize: '13px', fontWeight: 700, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile?.name?.split(' ')[0] ?? 'Account'}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div
                      style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                        background: '#fff', border: '2px solid #111', boxShadow: '6px 6px 0 #111',
                        minWidth: '180px', zIndex: 1000,
                      }}
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{profile?.name ?? user.email}</div>
                        <div style={{ color: '#888', fontSize: '11px', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{profile?.role ?? 'Student'}</div>
                      </div>
                      {[
                        { href: '/dashboard', label: 'Dashboard' },
                        { href: '/my-listings', label: 'My Listings' },
                        { href: '/bookings', label: '📅 My Bookings' },
                        { href: '/messages', label: 'Messages' },
                        { href: '/profile', label: 'Edit Profile' },
                        ...(profile?.role === 'admin' ? [{ href: '/admin', label: '⚙ Admin Panel' }] : []),
                      ].map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          style={{ display: 'block', padding: '10px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', color: '#111', borderBottom: '1px solid #f0f0f0', transition: '0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8f8f8'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <button
                        onClick={handleSignOut}
                        style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: '13px', fontWeight: 700, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontFamily: '"Space Grotesk", sans-serif' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fee2e2'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  style={{ padding: '10px 18px', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', textDecoration: 'none', color: '#111', border: '2px solid #111', letterSpacing: '0.5px' }}
                >
                  SIGN IN
                </Link>
                <Link href="/auth/register" className="nav-sell-btn" style={{ background: '#1B5E20', borderColor: '#1B5E20', color: '#fff' }}>
                  JOIN FREE
                </Link>
              </>
            )
          )}

          {/* Mobile hamburger — shown via CSS at ≤1024px */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: '2px solid #111', cursor: 'pointer', padding: '6px 10px', display: 'none' }}
            className="mobile-menu-btn"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {mobileOpen
                ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              }
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          background: '#fff',
          borderBottom: '2px solid #111',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block',
                padding: '12px 16px',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                color: pathname?.startsWith(link.href) ? '#5d3fd3' : '#111',
                borderBottom: '1px solid #eee',
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ paddingTop: '12px', display: 'flex', gap: '8px' }}>
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '12px', border: '2px solid #111', fontWeight: 700, textDecoration: 'none', color: '#111' }}>
                  DASHBOARD
                </Link>
                <button onClick={() => { handleSignOut(); setMobileOpen(false) }} style={{ flex: 1, textAlign: 'center', padding: '12px', background: '#dc2626', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif' }}>
                  SIGN OUT
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '12px', border: '2px solid #111', fontWeight: 700, textDecoration: 'none', color: '#111' }}>
                  SIGN IN
                </Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '12px', background: '#111', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
                  JOIN FREE
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {searchOpen && (
        <div className="search-overlay" onClick={closeSearch}>
          <div className="search-container" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search goods & services..."
                className="search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </form>
            <button className="search-close" onClick={closeSearch}>✕</button>

            {/* Instant results dropdown */}
            {searchQuery.trim() && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#fff',
                border: '2px solid #111',
                borderTop: 'none',
                boxShadow: '6px 6px 0 #111',
                zIndex: 200,
                maxHeight: '420px',
                overflowY: 'auto',
              }}>
                {instantLoading && (
                  <div style={{ padding: '16px', fontFamily: '"Space Grotesk", sans-serif', fontSize: '13px', color: '#888', fontWeight: 600 }}>
                    Searching...
                  </div>
                )}

                {!instantLoading && instantHits.length === 0 && (
                  <div style={{ padding: '16px', fontFamily: '"Space Grotesk", sans-serif', fontSize: '13px', color: '#888' }}>
                    No results for &ldquo;{searchQuery}&rdquo;
                  </div>
                )}

                {!instantLoading && instantHits.length > 0 && (
                  <>
                    {instantHits.map(hit => {
                      const label = hit.title ?? hit.name ?? ''
                      const href = hit.type === 'product' ? `/goods/${hit.id}` : `/services/${hit.id}`
                      const tag = hit.type === 'product' ? 'GOODS' : 'SERVICE'
                      const tagColor = hit.type === 'product' ? '#5d3fd3' : '#1B5E20'
                      return (
                        <Link
                          key={`${hit.type}-${hit.id}`}
                          href={href}
                          onClick={closeSearch}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            textDecoration: 'none',
                            color: '#111',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8f8f8'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          {hit.image_url ? (
                            <img src={hit.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', background: '#f0f0f0', border: '1px solid #eee', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {label}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', color: '#fff', background: tagColor, padding: '1px 6px' }}>
                                {tag}
                              </span>
                              {hit.category && (
                                <span style={{ fontSize: '11px', color: '#888', fontFamily: '"Space Grotesk", sans-serif' }}>
                                  {hit.category}
                                </span>
                              )}
                            </div>
                          </div>
                          {hit.price !== undefined && (
                            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', flexShrink: 0 }}>
                              GHS {hit.price}
                            </div>
                          )}
                        </Link>
                      )
                    })}

                    {/* Footer actions */}
                    <div style={{ display: 'flex', borderTop: '2px solid #111' }}>
                      <Link
                        href={`/goods?q=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={closeSearch}
                        style={{ flex: 1, padding: '11px 16px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', color: '#5d3fd3', borderRight: '1px solid #eee', letterSpacing: '0.5px' }}
                      >
                        ALL GOODS →
                      </Link>
                      <Link
                        href={`/services?q=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={closeSearch}
                        style={{ flex: 1, padding: '11px 16px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', color: '#1B5E20', letterSpacing: '0.5px' }}
                      >
                        ALL SERVICES →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
