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
      <style>{`
        .dash-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 32px; }
        .dash-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .dash-actions { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        @media (max-width: 768px) {
          .dash-stats { grid-template-columns: 1fr 1fr !important; }
          .dash-panels { grid-template-columns: 1fr !important; }
          .dash-actions { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ background: '#FAFAF8', borderBottom: '1px solid #E8E5E0', padding: '32px 20px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '32px', letterSpacing: '-1px', color: '#1A1A1A', lineHeight: 1 }}>
                Dashboard
              </div>
              <p style={{ color: '#9A9590', marginTop: '6px', fontSize: '14px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Welcome back, <span style={{ color: '#1A1A1A', fontWeight: 700 }}>{firstName}</span> · {profile?.department ?? 'Campus Student'}
              </p>
            </div>
            <Link
              href="/sell"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '11px 24px',
                background: '#1B5E20', color: '#fff',
                fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px', fontWeight: 700,
                textDecoration: 'none', borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(27,94,32,0.25)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Listing
            </Link>
          </div>
        </div>
      </div>

      <SectionWrapper className="bg-[#f8f8f8]">

        {/* Stats Grid */}
        <div className="dash-stats">
          {stats.map(stat => {
            const tints: Record<string, string> = { '#5d3fd3': '#EDE9FE', '#1B5E20': '#E8F5E9', '#ff3366': '#FFE4EC', '#111': '#F3F2EF' }
            const tint = tints[stat.color] ?? '#F3F2EF'
            return (
              <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: '#fff', border: '1px solid #E8E5E0', borderRadius: '14px',
                  padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)', cursor: 'pointer',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color: stat.color }}>{stat.icon}</div>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '32px', color: '#1A1A1A', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: '#9A9590', fontWeight: 600, marginTop: '6px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{stat.label}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Subscription Status */}
        {!dataLoading && (() => {
          const isActive = subExpiry && new Date(subExpiry) > new Date()
          if (!isActive) {
            return (
              <div style={{ marginBottom: '20px', padding: '16px 20px', background: '#FFF0F3', border: '1px solid #ffc0cb', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFE4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ff3366' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '14px', color: '#1A1A1A', marginBottom: '2px' }}>No active seller subscription</div>
                  <div style={{ color: '#9A9590', fontSize: '13px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Subscribe for GHS 20/month to list goods and services.</div>
                </div>
                <Link href="/subscribe" style={{ display: 'inline-block', padding: '10px 20px', background: '#ff3366', color: '#fff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px', fontWeight: 700, textDecoration: 'none', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                  Subscribe →
                </Link>
              </div>
            )
          }
          const daysLeft = Math.ceil((new Date(subExpiry).getTime() - Date.now()) / 86400000)
          const expiring = daysLeft <= 7
          return (
            <div style={{ marginBottom: '20px', padding: '16px 20px', background: expiring ? '#FFFBEB' : '#F0FDF4', border: `1px solid ${expiring ? '#fcd34d' : '#86efac'}`, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: expiring ? '#FEF3C7' : '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: expiring ? '#f59e0b' : '#1B5E20' }}>
                {expiring
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                }
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: expiring ? '#92400e' : '#1B5E20', marginBottom: '2px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  {expiring ? `Subscription expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Seller subscription active'}
                </div>
                <div style={{ color: '#9A9590', fontSize: '12px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Expires {new Date(subExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              {expiring && (
                <Link href="/subscribe" style={{ display: 'inline-block', padding: '9px 18px', background: '#f59e0b', color: '#fff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                  Renew Now →
                </Link>
              )}
            </div>
          )
        })()}

        {/* Main Content Grid */}
        <div className="dash-panels">

          {/* My Listings */}
          <div style={{ border: '1px solid #E8E5E0', background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E5E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '13px', letterSpacing: '0.3px', color: '#1A1A1A' }}>My Listings</span>
              <Link href="/my-listings" style={{ color: '#1B5E20', fontSize: '12px', textDecoration: 'none', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>View All →</Link>
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
            <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F2EF' }}>
              <Link href="/sell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', color: '#1B5E20', fontWeight: 700, textDecoration: 'none', border: '1.5px dashed #86efac', borderRadius: '8px', fontSize: '13px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                + Add New Listing
              </Link>
            </div>
          </div>

          {/* Bookings */}
          <div style={{ border: '1px solid #E8E5E0', background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E5E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '13px', letterSpacing: '0.3px', color: '#1A1A1A' }}>My Bookings</span>
              <Link href="/bookings" style={{ color: '#1B5E20', fontSize: '12px', textDecoration: 'none', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>View All →</Link>
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
            <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F2EF' }}>
              <Link href="/bookings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', color: '#1B5E20', fontWeight: 700, textDecoration: 'none', border: '1.5px dashed #86efac', borderRadius: '8px', fontSize: '13px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                View All Bookings →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ border: '1px solid #E8E5E0', background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E5E0' }}>
            <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '13px', letterSpacing: '0.3px', color: '#1A1A1A' }}>Quick Actions</span>
          </div>
          <div style={{ padding: '16px' }} className="dash-actions">
            {[
              { href: '/sell', label: 'Sell Item', color: '#5d3fd3', tint: '#EDE9FE', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
              { href: '/offer-service', label: 'Offer Service', color: '#1B5E20', tint: '#E8F5E9', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
              { href: '/bookings', label: 'My Bookings', color: '#1A1A1A', tint: '#F3F2EF', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
              { href: '/messages', label: 'Messages', color: '#ff3366', tint: '#FFE4EC', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              { href: '/profile', label: 'Edit Profile', color: '#6B6660', tint: '#F3F2EF', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
            ].map(action => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{ textAlign: 'center', padding: '16px 8px', border: '1px solid #E8E5E0', borderRadius: '10px', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)', background: '#fff', cursor: 'pointer' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = action.color
                    ;(e.currentTarget as HTMLElement).style.background = action.tint
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#E8E5E0'
                    ;(e.currentTarget as HTMLElement).style.background = '#fff'
                    ;(e.currentTarget as HTMLElement).style.transform = 'none'
                  }}
                >
                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', color: action.color }}>{action.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '11px', color: '#6B6660', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{action.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Profile Setup Prompt */}
        {(!profile?.department || !profile?.phone) && (
          <div style={{ marginTop: '20px', padding: '16px 20px', background: '#FFFBEB', border: '1px solid #fcd34d', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#f59e0b' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px', fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1A1A1A' }}>Complete your profile to get more views</div>
              <div style={{ color: '#9A9590', fontSize: '13px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Add a profile photo, bio, and phone number to build trust with buyers and sellers.</div>
            </div>
            <Link href="/profile" style={{
              display: 'inline-block', padding: '10px 20px',
              background: '#f59e0b', color: '#fff',
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px', fontWeight: 700,
              textDecoration: 'none', borderRadius: '8px', whiteSpace: 'nowrap',
            }}>
              Update Profile
            </Link>
          </div>
        )}
      </SectionWrapper>
    </>
  )
}
