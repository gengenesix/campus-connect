"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { mockGoods, mockServices } from '@/lib/mockData'
import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/dashboard')
  }, [user, loading, router])

  const myListings = mockGoods.slice(0, 3)
  const myBookings = mockServices.slice(0, 2)

  const stats = [
    { label: 'My Listings', value: '3', icon: '📦', color: '#5d3fd3', href: '/my-listings' },
    { label: 'Active Bookings', value: '2', icon: '📅', color: '#1B5E20', href: '/services' },
    { label: 'Unread Messages', value: '—', icon: '💬', color: '#ff3366', href: '/messages' },
    { label: 'Profile Views', value: '—', icon: '👁', color: '#111', href: '/profile' },
  ]

  const firstName = profile?.name?.split(' ')[0] ?? 'there'

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>
                DASHBOARD
              </div>
              <p style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>
                Welcome back, {firstName} 👋 · {profile?.department ?? 'UMaT Student'}
              </p>
            </div>
            <Link
              href="/sell"
              style={{
                display: 'inline-block', padding: '12px 28px',
                background: '#a78bfa', color: '#111',
                fontFamily: '"Archivo Black", sans-serif', fontSize: '14px',
                textDecoration: 'none', border: '2px solid #a78bfa',
                boxShadow: '3px 3px 0 #fff',
              }}
            >
              + NEW LISTING
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '36px' }}>
          {stats.map(stat => (
            <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '2px solid #111', background: '#fff', padding: '20px', boxShadow: '4px 4px 0 #111', transition: '0.15s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #111' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #111' }}
              >
                <div style={{ fontSize: '22px', marginBottom: '10px' }}>{stat.icon}</div>
                <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, marginTop: '6px', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

          {/* My Listings */}
          <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '4px 4px 0 #111' }}>
            <div style={{ background: '#111', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', letterSpacing: '0.5px' }}>MY LISTINGS</span>
              <Link href="/my-listings" style={{ color: '#a78bfa', fontSize: '12px', textDecoration: 'none', fontWeight: 700 }}>View All →</Link>
            </div>
            <div>
              {myListings.map((listing, i) => (
                <Link key={listing.id} href={`/goods/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    display: 'flex', gap: '12px', alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: i < myListings.length - 1 ? '1px solid #f0f0f0' : 'none',
                    transition: '0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8f8f8'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <img src={listing.image} alt={listing.name} style={{ width: '52px', height: '52px', objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.name}</div>
                      <div style={{ color: '#5d3fd3', fontWeight: 700, fontFamily: '"Archivo Black"', fontSize: '14px' }}>GHS {listing.price}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', color: '#888' }}>{listing.views} views</div>
                      <div style={{ background: '#e8f5e9', color: '#1B5E20', padding: '2px 8px', fontSize: '10px', fontWeight: 700, marginTop: '4px', border: '1px solid #86efac' }}>ACTIVE</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
              <Link href="/sell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', color: '#5d3fd3', fontWeight: 700, textDecoration: 'none', border: '2px dashed #5d3fd3', fontSize: '13px' }}>
                + Add New Listing
              </Link>
            </div>
          </div>

          {/* Bookings */}
          <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '4px 4px 0 #111' }}>
            <div style={{ background: '#1B5E20', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', letterSpacing: '0.5px' }}>MY BOOKINGS</span>
              <Link href="/services" style={{ color: '#86efac', fontSize: '12px', textDecoration: 'none', fontWeight: 700 }}>Browse →</Link>
            </div>
            <div>
              {myBookings.map((booking, i) => (
                <Link key={booking.id} href={`/services/${booking.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    display: 'flex', gap: '12px', alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: i < myBookings.length - 1 ? '1px solid #f0f0f0' : 'none',
                    transition: '0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8f8f8'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <img src={booking.image} alt={booking.name} style={{ width: '52px', height: '52px', objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{booking.name}</div>
                      <div style={{ color: '#1B5E20', fontWeight: 700, fontFamily: '"Archivo Black"', fontSize: '14px' }}>{booking.rate}</div>
                    </div>
                    <span style={{ background: '#e8f5e9', color: '#1B5E20', padding: '4px 10px', fontSize: '10px', fontWeight: 700, border: '1px solid #86efac', flexShrink: 0 }}>
                      BOOKED
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
              <Link href="/services" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', color: '#1B5E20', fontWeight: 700, textDecoration: 'none', border: '2px dashed #1B5E20', fontSize: '13px' }}>
                + Book a Service
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '4px 4px 0 #111' }}>
          <div style={{ background: '#f0f0f0', padding: '14px 20px', borderBottom: '2px solid #111' }}>
            <span style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', letterSpacing: '0.5px' }}>QUICK ACTIONS</span>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { href: '/sell', label: 'Sell Item', icon: '📦', color: '#5d3fd3' },
              { href: '/offer-service', label: 'Offer Service', icon: '🛠️', color: '#1B5E20' },
              { href: '/messages', label: 'Messages', icon: '💬', color: '#ff3366' },
              { href: '/profile', label: 'Edit Profile', icon: '👤', color: '#111' },
            ].map(action => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{ textAlign: 'center', padding: '20px 12px', border: '2px solid #eee', transition: '0.15s', background: '#fff', cursor: 'pointer' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#111'
                    ;(e.currentTarget as HTMLElement).style.background = '#f8f8f8'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0 #111'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#eee'
                    ;(e.currentTarget as HTMLElement).style.background = '#fff'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{action.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px', color: '#111' }}>{action.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Profile Setup Prompt */}
        <div style={{ marginTop: '24px', padding: '20px 24px', background: '#fff', border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '32px' }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Complete your profile to get more views</div>
            <div style={{ color: '#888', fontSize: '13px' }}>Add a profile photo, bio, and phone number to build trust with buyers and sellers.</div>
          </div>
          <Link href="/profile" style={{
            display: 'inline-block', padding: '10px 24px',
            background: '#f59e0b', color: '#111',
            fontFamily: '"Archivo Black", sans-serif', fontSize: '13px',
            textDecoration: 'none', border: '2px solid #111',
            boxShadow: '3px 3px 0 #111', whiteSpace: 'nowrap',
          }}>
            UPDATE PROFILE
          </Link>
        </div>
      </div>
    </div>
  )
}
