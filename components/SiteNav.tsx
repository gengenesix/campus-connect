"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from './NotificationBell'

interface InstantHit {
  id: string
  title?: string
  name?: string
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
  const [campusShortName, setCampusShortName] = useState<string>('')

  useEffect(() => {
    if (!profile?.university_id) { setCampusShortName(''); return }
    fetch('/api/universities')
      .then(r => r.json())
      .then(({ universities }) => {
        const found = (universities ?? []).find((u: any) => u.id === profile.university_id)
        if (found?.short_name) setCampusShortName(found.short_name)
      })
      .catch(() => {})
  }, [profile?.university_id])

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
    { href: '/#universities', label: 'Universities' },
    { href: '/goods', label: 'Browse Goods' },
    { href: '/services', label: 'Services' },
    { href: '/sell', label: 'Sell' },
  ]

  return (
    <>
      {/* Marquee Bar */}
      <div className="marquee-bar">
        <div className="marquee-container">
          <div className="marquee-content">
            100% FREE &bull; NO COMMISSION &bull; 43 GHANA UNIVERSITIES &bull; BUY &amp; SELL GOODS &bull; BOOK CAMPUS SERVICES &bull; PEER-TO-PEER MARKETPLACE &bull;&nbsp;
            100% FREE &bull; NO COMMISSION &bull; 43 GHANA UNIVERSITIES &bull; BUY &amp; SELL GOODS &bull; BOOK CAMPUS SERVICES &bull; PEER-TO-PEER MARKETPLACE &bull;
          </div>
        </div>
      </div>

      {/* Navigation — sticky glass wrapper */}
      <div className="nav-wrapper">
        <nav className="navigation">
          {/* Logo */}
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/">
              CAMPUS<span>.</span>CONNECT
            </Link>
            <div className="beta-badge">BETA</div>
            {campusShortName && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#E8F5E9', color: '#1B5E20',
                padding: '4px 10px', fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.5px', fontFamily: '"Plus Jakarta Sans", sans-serif',
                border: '1px solid #1B5E20', borderRadius: '999px', whiteSpace: 'nowrap',
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1B5E20', display: 'inline-block', flexShrink: 0 }} />
                {campusShortName}
              </span>
            )}
          </div>

          {/* Desktop nav links */}
          <div className="nav-links">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${pathname?.startsWith(link.href.replace('/#universities','')) && link.href !== '/#universities' ? ' nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="nav-actions">
            {/* Search icon */}
            <div
              className="nav-icon"
              onClick={() => { if (searchOpen) closeSearch(); else setSearchOpen(true) }}
              aria-label="Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {user && (
              <>
                <Link href="/messages" className="nav-icon" aria-label="Messages">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                    + Sell
                  </Link>

                  {/* User avatar + dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'none',
                        border: '1.5px solid #E8E5E0',
                        borderRadius: '999px',
                        padding: '5px 12px 5px 5px',
                        cursor: 'pointer',
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#D1CEC8'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#E8E5E0'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                      }}
                      aria-label="User menu"
                    >
                      {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt={profile.name ?? ''} width={26} height={26} style={{ borderRadius: '50%', objectFit: 'cover' }} unoptimized />
                      ) : (
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px' }}>
                          {initials}
                        </div>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1A1A1A' }}>
                        {profile?.name?.split(' ')[0] ?? 'Account'}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9A9590" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {userMenuOpen && (
                      <div
                        style={{
                          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                          background: '#fff',
                          border: '1px solid #E8E5E0',
                          borderRadius: '12px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                          minWidth: '188px', zIndex: 1000,
                          overflow: 'hidden',
                        }}
                        onMouseLeave={() => setUserMenuOpen(false)}
                      >
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F2EF' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#1A1A1A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{profile?.name ?? user.email}</div>
                          <div style={{ color: '#9A9590', fontSize: '11px', marginTop: '2px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{profile?.role ?? 'Student'}</div>
                        </div>
                        {[
                          { href: '/dashboard',   label: 'Dashboard' },
                          { href: '/my-listings', label: 'My Listings' },
                          { href: '/bookings',    label: 'My Bookings' },
                          { href: '/messages',    label: 'Messages' },
                          { href: '/profile',     label: 'Edit Profile' },
                          ...(profile?.role === 'admin' ? [{ href: '/admin', label: 'Admin Panel' }] : []),
                        ].map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            style={{
                              display: 'block', padding: '10px 16px',
                              fontSize: '13px', fontWeight: 500,
                              textDecoration: 'none', color: '#1A1A1A',
                              borderBottom: '1px solid #F3F2EF',
                              transition: 'background 0.1s',
                              fontFamily: '"Plus Jakarta Sans", sans-serif',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFAF8'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            {item.label}
                          </Link>
                        ))}
                        <button
                          onClick={handleSignOut}
                          style={{
                            display: 'block', width: '100%', padding: '10px 16px',
                            fontSize: '13px', fontWeight: 600, textAlign: 'left',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#dc2626', fontFamily: '"Plus Jakarta Sans", sans-serif',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
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
                    style={{
                      padding: '9px 18px',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontWeight: 700, fontSize: '13px',
                      textDecoration: 'none', color: '#1A1A1A',
                      border: '1.5px solid #E8E5E0',
                      borderRadius: '6px',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#D1CEC8'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E8E5E0'}
                  >
                    Sign In
                  </Link>
                  <Link href="/auth/register" className="nav-sell-btn" style={{ background: '#1B5E20', borderColor: '#1B5E20', color: '#fff', boxShadow: '3px 3px 0 #1A1A1A' }}>
                    Join Free
                  </Link>
                </>
              )
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                background: 'none', border: '1.5px solid #E8E5E0',
                borderRadius: '8px', cursor: 'pointer', padding: '7px 10px',
                display: 'none', color: '#1A1A1A',
                transition: 'border-color 0.2s',
              }}
              className="mobile-menu-btn"
              aria-label="Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            borderTop: '1px solid #F3F2EF',
            padding: '12px 20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block', padding: '11px 14px',
                  fontWeight: 600, fontSize: '14px',
                  textDecoration: 'none',
                  color: pathname?.startsWith(link.href.replace('/#universities','')) && link.href !== '/#universities' ? '#5d3fd3' : '#1A1A1A',
                  borderRadius: '8px',
                  transition: 'background 0.1s',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F3F2EF'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {link.label}
              </Link>
            ))}
            <div style={{ paddingTop: '10px', display: 'flex', gap: '8px' }}>
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '11px', border: '1.5px solid #E8E5E0', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', color: '#1A1A1A', fontSize: '13px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    Dashboard
                  </Link>
                  <button onClick={() => { handleSignOut(); setMobileOpen(false) }} style={{ flex: 1, textAlign: 'center', padding: '11px', background: '#dc2626', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px' }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '11px', border: '1.5px solid #E8E5E0', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', color: '#1A1A1A', fontSize: '13px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    Sign In
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '11px', background: '#1B5E20', color: '#fff', fontWeight: 700, textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    Join Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

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

            {searchQuery.trim() && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#fff',
                border: '1px solid #E8E5E0',
                borderRadius: '0 0 12px 12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                zIndex: 200, maxHeight: '400px', overflowY: 'auto',
              }}>
                {instantLoading && (
                  <div style={{ padding: '16px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px', color: '#9A9590', fontWeight: 600 }}>
                    Searching...
                  </div>
                )}
                {!instantLoading && instantHits.length === 0 && (
                  <div style={{ padding: '16px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px', color: '#9A9590' }}>
                    No results for &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
                {!instantLoading && instantHits.length > 0 && (
                  <>
                    {instantHits.map(hit => {
                      const label = hit.title ?? hit.name ?? ''
                      const href = hit.type === 'product' ? `/goods/${hit.id}` : `/services/${hit.id}`
                      const tag = hit.type === 'product' ? 'Goods' : 'Service'
                      const tagColor = hit.type === 'product' ? '#5d3fd3' : '#1B5E20'
                      const tagBg = hit.type === 'product' ? '#EDE9FE' : '#E8F5E9'
                      return (
                        <Link
                          key={`${hit.type}-${hit.id}`}
                          href={href}
                          onClick={closeSearch}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 16px',
                            borderBottom: '1px solid #F3F2EF',
                            textDecoration: 'none', color: '#1A1A1A',
                            transition: 'background 0.1s',
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFAF8'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          {hit.image_url ? (
                            <img src={hit.image_url} alt="" style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E8E5E0', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '38px', height: '38px', background: '#F3F2EF', borderRadius: '6px', border: '1px solid #E8E5E0', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {label}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: tagColor, background: tagBg, padding: '1px 7px', borderRadius: '999px' }}>
                                {tag}
                              </span>
                              {hit.category && (
                                <span style={{ fontSize: '11px', color: '#9A9590' }}>
                                  {hit.category}
                                </span>
                              )}
                            </div>
                          </div>
                          {hit.price !== undefined && (
                            <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '13px', flexShrink: 0, color: '#5d3fd3' }}>
                              GHS {hit.price}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                    <div style={{ display: 'flex', borderTop: '1px solid #F3F2EF' }}>
                      <Link
                        href={`/goods?q=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={closeSearch}
                        style={{ flex: 1, padding: '11px 16px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', color: '#5d3fd3', borderRight: '1px solid #F3F2EF' }}
                      >
                        All Goods →
                      </Link>
                      <Link
                        href={`/services?q=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={closeSearch}
                        style={{ flex: 1, padding: '11px 16px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', color: '#1B5E20' }}
                      >
                        All Services →
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
