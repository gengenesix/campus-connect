"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import SectionWrapper from '@/components/ui/SectionWrapper'

interface Listing {
  id: string
  title: string
  price: number
  image_url: string | null
  views: number
  status: string
}

interface Booking {
  id: string
  status: string
  service: {
    id: string
    name: string
    rate: string | null
    image_url: string | null
  } | null
}

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [subExpiry, setSubExpiry] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/dashboard')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      setDataLoading(true)

      const [listingsRes, bookingsRes, unreadRes, subRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, title, price, image_url, views, status')
          .eq('seller_id', user.id)
          .neq('status', 'deleted')
          .order('created_at', { ascending: false })
          .limit(3),

        supabase
          .from('bookings')
          .select(`
            id, status,
            service:services!service_id (id, name, rate, image_url)
          `)
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2),

        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false),

        supabase
          .from('profiles')
          .select('subscription_expires_at')
          .eq('id', user.id)
          .single(),
      ])

      setMyListings((listingsRes.data as Listing[]) ?? [])
      setMyBookings((bookingsRes.data as unknown as Booking[]) ?? [])
      setUnreadCount(unreadRes.count ?? 0)
      setSubExpiry((subRes.data as any)?.subscription_expires_at ?? null)
      setDataLoading(false)
    }

    fetchDashboardData()
  }, [user])

  const activeListings = myListings.filter(l => l.status === 'active').length
  const firstName = profile?.name?.split(' ')[0] ?? 'there'

  const stats = [
    { label: 'My Listings', value: dataLoading ? '—' : String(myListings.length), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, color: '#5d3fd3', href: '/my-listings' },
    { label: 'Active', value: dataLoading ? '—' : String(activeListings), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, color: '#1B5E20', href: '/my-listings' },
    { label: 'Unread Messages', value: dataLoading ? '—' : String(unreadCount), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, color: '#ff3366', href: '/messages' },
    { label: 'My Bookings', value: dataLoading ? '—' : String(myBookings.length), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, color: '#111', href: '/bookings' },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Syne", sans-serif', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: '"Syne", sans-serif', color: '#888' }}>Loading...</div>
    </div>
  )

  return (
    <>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>
                DASHBOARD
              </div>
              <p style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>
                Welcome back, {firstName} · {profile?.department ?? 'Campus Student'}
              </p>
            </div>
            <Link
              href="/sell"
              style={{
                display: 'inline-block', padding: '12px 28px',
                background: '#a78bfa', color: '#111',
                fontFamily: '"Syne", sans-serif', fontSize: '14px',
                textDecoration: 'none', border: '2px solid #a78bfa',
                boxShadow: '3px 3px 0 #fff',
              }}
            >
              + NEW LISTING
            </Link>
          </div>
        </div>
      </div>

      <SectionWrapper className="bg-[#f8f8f8]">

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '36px' }}>
          {stats.map(stat => (
            <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '2px solid #111', background: '#fff', padding: '20px', boxShadow: '4px 4px 0 #111', transition: '0.15s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #111' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #111' }}
              >
                <div style={{ marginBottom: '10px', color: stat.color }}>{stat.icon}</div>
                <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '36px', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, marginTop: '6px', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Subscription Status */}
        {!dataLoading && (() => {
          const isActive = subExpiry && new Date(subExpiry) > new Date()
          if (!isActive) {
            return (
              <div style={{ marginBottom: '24px', padding: '18px 24px', background: '#fff', border: '2px solid #ff3366', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', boxShadow: '4px 4px 0 #ff3366' }}>
                <div style={{ color: '#ff3366' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '15px', marginBottom: '3px' }}>NO ACTIVE SELLER SUBSCRIPTION</div>
                  <div style={{ color: '#888', fontSize: '13px' }}>Subscribe for GHS 20/month to list goods and services on Campus Connect.</div>
                </div>
                <Link href="/subscribe" style={{ display: 'inline-block', padding: '10px 24px', background: '#ff3366', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '13px', textDecoration: 'none', border: '2px solid #111', boxShadow: '3px 3px 0 #111', whiteSpace: 'nowrap' }}>
                  SUBSCRIBE →
                </Link>
              </div>
            )
          }
          const daysLeft = Math.ceil((new Date(subExpiry).getTime() - Date.now()) / 86400000)
          const expiring = daysLeft <= 7
          return (
            <div style={{ marginBottom: '24px', padding: '16px 24px', background: '#fff', border: `2px solid ${expiring ? '#f59e0b' : '#1B5E20'}`, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ color: expiring ? '#f59e0b' : '#1B5E20' }}>{expiring ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}</div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: expiring ? '#92400e' : '#1B5E20', marginBottom: '2px' }}>
                  {expiring ? `SUBSCRIPTION EXPIRING IN ${daysLeft} DAY${daysLeft !== 1 ? 'S' : ''}` : 'SELLER SUBSCRIPTION ACTIVE'}
                </div>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  Expires {new Date(subExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              {expiring && (
                <Link href="/subscribe" style={{ display: 'inline-block', padding: '9px 20px', background: '#f59e0b', color: '#111', fontFamily: '"Syne", sans-serif', fontSize: '12px', textDecoration: 'none', border: '2px solid #111', boxShadow: '3px 3px 0 #111', whiteSpace: 'nowrap' }}>
                  RENEW NOW →
                </Link>
              )}
            </div>
          )
        })()}

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

          {/* My Listings */}
          <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '4px 4px 0 #111' }}>
            <div style={{ background: '#111', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '14px', letterSpacing: '0.5px' }}>MY LISTINGS</span>
              <Link href="/my-listings" style={{ color: '#a78bfa', fontSize: '12px', textDecoration: 'none', fontWeight: 700 }}>View All →</Link>
            </div>
            <div>
              {dataLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Loading...</div>
              ) : myListings.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>No listings yet.</div>
              ) : (
                myListings.map((listing, i) => (
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
                      {listing.image_url ? (
                        <Image src={listing.image_url} alt={listing.title} width={52} height={52} style={{ objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '52px', height: '52px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#bbb' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</div>
                        <div style={{ color: '#5d3fd3', fontWeight: 700, fontFamily: '"Archivo Black"', fontSize: '14px' }}>GHS {listing.price.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '11px', color: '#888' }}>{listing.views} views</div>
                        <div style={{
                          padding: '2px 8px', fontSize: '10px', fontWeight: 700, marginTop: '4px', border: '1px solid',
                          background: listing.status === 'active' ? '#e8f5e9' : '#f0f0f0',
                          color: listing.status === 'active' ? '#1B5E20' : '#888',
                          borderColor: listing.status === 'active' ? '#86efac' : '#ddd',
                        }}>
                          {listing.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
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
              <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '14px', letterSpacing: '0.5px' }}>MY BOOKINGS</span>
              <Link href="/bookings" style={{ color: '#86efac', fontSize: '12px', textDecoration: 'none', fontWeight: 700 }}>View All →</Link>
            </div>
            <div>
              {dataLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Loading...</div>
              ) : myBookings.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>No bookings yet.</div>
              ) : (
                myBookings.map((booking, i) => (
                  <Link key={booking.id} href={booking.service ? `/services/${booking.service.id}` : '/services'} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                      display: 'flex', gap: '12px', alignItems: 'center',
                      padding: '14px 16px',
                      borderBottom: i < myBookings.length - 1 ? '1px solid #f0f0f0' : 'none',
                      transition: '0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8f8f8'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {booking.service?.image_url ? (
                        <Image src={booking.service.image_url} alt={booking.service.name} width={52} height={52} style={{ objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '52px', height: '52px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#86efac' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{booking.service?.name ?? 'Service'}</div>
                        <div style={{ color: '#1B5E20', fontWeight: 700, fontFamily: '"Archivo Black"', fontSize: '14px' }}>{booking.service?.rate ?? '—'}</div>
                      </div>
                      <span style={{
                        padding: '4px 10px', fontSize: '10px', fontWeight: 700, flexShrink: 0, textTransform: 'uppercase', border: '1px solid',
                        background: booking.status === 'confirmed' ? '#e8f5e9' : booking.status === 'completed' ? '#ede9fe' : booking.status === 'cancelled' ? '#f0f0f0' : '#fffbeb',
                        color: booking.status === 'confirmed' ? '#1B5E20' : booking.status === 'completed' ? '#5d3fd3' : booking.status === 'cancelled' ? '#666' : '#92400e',
                        borderColor: booking.status === 'confirmed' ? '#86efac' : booking.status === 'completed' ? '#a78bfa' : booking.status === 'cancelled' ? '#ccc' : '#fcd34d',
                      }}>
                        {booking.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
              <Link href="/bookings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', color: '#1B5E20', fontWeight: 700, textDecoration: 'none', border: '2px dashed #1B5E20', fontSize: '13px' }}>
                View All Bookings →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '4px 4px 0 #111' }}>
          <div style={{ background: '#f0f0f0', padding: '14px 20px', borderBottom: '2px solid #111' }}>
            <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '14px', letterSpacing: '0.5px' }}>QUICK ACTIONS</span>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {[
              { href: '/sell', label: 'Sell Item', color: '#5d3fd3', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
              { href: '/offer-service', label: 'Offer Service', color: '#1B5E20', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
              { href: '/bookings', label: 'My Bookings', color: '#111', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
              { href: '/messages', label: 'Messages', color: '#ff3366', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              { href: '/profile', label: 'Edit Profile', color: '#444', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
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
                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', color: action.color }}>{action.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px', color: '#111' }}>{action.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Profile Setup Prompt */}
        {(!profile?.department || !profile?.phone) && (
          <div style={{ marginTop: '24px', padding: '20px 24px', background: '#fff', border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ color: '#f59e0b' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Complete your profile to get more views</div>
              <div style={{ color: '#888', fontSize: '13px' }}>Add a profile photo, bio, and phone number to build trust with buyers and sellers.</div>
            </div>
            <Link href="/profile" style={{
              display: 'inline-block', padding: '10px 24px',
              background: '#f59e0b', color: '#111',
              fontFamily: '"Syne", sans-serif', fontSize: '13px',
              textDecoration: 'none', border: '2px solid #111',
              boxShadow: '3px 3px 0 #111', whiteSpace: 'nowrap',
            }}>
              UPDATE PROFILE
            </Link>
          </div>
        )}
      </SectionWrapper>
    </>
  )
}
