"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import SectionWrapper from '@/components/ui/SectionWrapper'

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface Booking {
  id: string
  status: BookingStatus
  notes: string | null
  scheduled_at: string | null
  created_at: string
  service: { id: string; name: string; rate: string | null; image_url: string | null; category: string } | null
  client: { id: string; name: string; avatar_url: string | null } | null
  provider: { id: string; name: string; avatar_url: string | null } | null
}

const STATUS_STYLES: Record<BookingStatus, { bg: string; color: string; border: string; label: string }> = {
  pending:   { bg: '#fffbeb', color: '#92400e', border: '#fcd34d', label: 'PENDING' },
  confirmed: { bg: '#e8f5e9', color: '#1B5E20', border: '#86efac', label: 'CONFIRMED' },
  completed: { bg: '#ede9fe', color: '#5d3fd3', border: '#a78bfa', label: 'COMPLETED' },
  cancelled: { bg: '#f0f0f0', color: '#666',    border: '#ccc',    label: 'CANCELLED' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(dateStr).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })
}

export default function BookingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'client' | 'provider'>('client')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [fetching, setFetching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/bookings')
  }, [user, loading, router])

  const fetchBookings = useCallback(async () => {
    if (!user) return
    setFetching(true)
    try {
      const res = await fetch(`/api/bookings?role=${tab}`)
      const json = await res.json()
      setBookings(json.bookings ?? [])
    } finally {
      setFetching(false)
    }
  }, [user, tab])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const updateStatus = async (bookingId: string, status: BookingStatus) => {
    setActionLoading(bookingId + status)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
      }
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const pending   = bookings.filter(b => b.status === 'pending').length
  const confirmed = bookings.filter(b => b.status === 'confirmed').length

  return (
    <>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>
                BOOKINGS
              </div>
              <p style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>
                Manage your service bookings
                {pending > 0 && <span style={{ marginLeft: '12px', background: '#ff3366', color: '#fff', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{pending} PENDING</span>}
                {confirmed > 0 && <span style={{ marginLeft: '8px', background: '#1B5E20', color: '#fff', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{confirmed} CONFIRMED</span>}
              </p>
            </div>
            <Link
              href="/services"
              style={{
                display: 'inline-block', padding: '12px 28px',
                background: '#1B5E20', color: '#fff',
                fontFamily: '"Archivo Black", sans-serif', fontSize: '13px',
                textDecoration: 'none', border: '2px solid #86efac',
                boxShadow: '3px 3px 0 #86efac',
              }}
            >
              + BOOK A SERVICE
            </Link>
          </div>
        </div>
      </div>

      <SectionWrapper className="bg-[#f8f8f8]">

        {/* Tabs */}
        <div style={{ display: 'flex', border: '2px solid #111', marginBottom: '28px', background: '#fff', boxShadow: '4px 4px 0 #111' }}>
          {(['client', 'provider'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '14px 20px', border: 'none', cursor: 'pointer',
                fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', letterSpacing: '0.5px',
                background: tab === t ? '#111' : '#fff',
                color: tab === t ? '#fff' : '#888',
                borderRight: t === 'client' ? '2px solid #111' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t === 'client' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  MY BOOKINGS
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  MY SERVICES (PROVIDER)
                </span>
              )}
            </button>
          ))}
        </div>

        {fetching ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#888', fontSize: '14px' }}>Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div style={{ background: '#fff', border: '2px solid #eee', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: '#ddd' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', marginBottom: '8px', color: '#111' }}>
              {tab === 'client' ? 'No bookings yet' : 'No service requests yet'}
            </div>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              {tab === 'client'
                ? 'Browse services and book something!'
                : 'Share your service listing to start getting bookings.'}
            </div>
            <Link
              href={tab === 'client' ? '/services' : '/offer-service'}
              style={{
                display: 'inline-block', padding: '12px 28px',
                background: '#1B5E20', color: '#fff',
                fontFamily: '"Archivo Black", sans-serif', fontSize: '13px',
                textDecoration: 'none', border: '2px solid #111', boxShadow: '3px 3px 0 #111',
              }}
            >
              {tab === 'client' ? 'BROWSE SERVICES →' : 'OFFER A SERVICE →'}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookings.map(booking => {
              const st = STATUS_STYLES[booking.status]
              const isLoading = (s: string) => actionLoading === booking.id + s

              return (
                <div
                  key={booking.id}
                  style={{
                    background: '#fff', border: '2px solid #111',
                    boxShadow: '4px 4px 0 #111', overflow: 'hidden',
                  }}
                >
                  {/* Booking header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                    {/* Service image */}
                    {booking.service?.image_url ? (
                      <Image
                        src={booking.service.image_url}
                        alt={booking.service.name}
                        width={64} height={64}
                        style={{ objectFit: 'cover', border: '2px solid #111', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: '64px', height: '64px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #111', flexShrink: 0, color: '#86efac' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <Link
                          href={`/services/${booking.service?.id}`}
                          style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', color: '#111', textDecoration: 'none' }}
                        >
                          {booking.service?.name ?? 'Service'}
                        </Link>
                        <span style={{
                          padding: '3px 10px', fontSize: '10px', fontWeight: 700,
                          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                        }}>
                          {st.label}
                        </span>
                      </div>
                      <div style={{ color: '#1B5E20', fontFamily: '"Archivo Black"', fontSize: '15px', marginBottom: '4px' }}>
                        {booking.service?.rate ?? 'Contact for pricing'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {tab === 'client'
                          ? `Provider: ${booking.provider?.name ?? '—'}`
                          : `Client: ${booking.client?.name ?? '—'}`
                        }
                        {' · '}
                        {timeAgo(booking.created_at)}
                      </div>
                    </div>

                    {/* Status dot */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      {booking.scheduled_at && (
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {new Date(booking.scheduled_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <span style={{ fontSize: '11px', color: '#888' }}>
                        {booking.service?.category}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div style={{ padding: '12px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '0.5px', marginRight: '8px' }}>NOTES:</span>
                      <span style={{ fontSize: '13px', color: '#444', fontStyle: 'italic' }}>{booking.notes}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ padding: '12px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Provider actions */}
                    {tab === 'provider' && booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(booking.id, 'confirmed')}
                          disabled={!!actionLoading}
                          style={{
                            padding: '8px 20px', background: isLoading('confirmed') ? '#888' : '#1B5E20', color: '#fff',
                            fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', letterSpacing: '0.5px',
                            border: '2px solid #111', boxShadow: '2px 2px 0 #111', cursor: actionLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isLoading('confirmed') ? '...' : '✓ CONFIRM'}
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, 'cancelled')}
                          disabled={!!actionLoading}
                          style={{
                            padding: '8px 20px', background: '#fff', color: '#ff3366',
                            fontWeight: 700, fontSize: '12px',
                            border: '2px solid #ff3366', cursor: actionLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isLoading('cancelled') ? '...' : 'DECLINE'}
                        </button>
                      </>
                    )}

                    {tab === 'provider' && booking.status === 'confirmed' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'completed')}
                        disabled={!!actionLoading}
                        style={{
                          padding: '8px 20px', background: isLoading('completed') ? '#888' : '#5d3fd3', color: '#fff',
                          fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', letterSpacing: '0.5px',
                          border: '2px solid #111', boxShadow: '2px 2px 0 #111', cursor: actionLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isLoading('completed') ? '...' : '★ MARK COMPLETE'}
                      </button>
                    )}

                    {/* Client can cancel pending */}
                    {tab === 'client' && booking.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'cancelled')}
                        disabled={!!actionLoading}
                        style={{
                          padding: '8px 16px', background: '#fff', color: '#888',
                          fontWeight: 700, fontSize: '12px',
                          border: '1px solid #ddd', cursor: actionLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isLoading('cancelled') ? '...' : 'Cancel request'}
                      </button>
                    )}

                    {/* Message link */}
                    {(booking.client?.id || booking.provider?.id) && (
                      <Link
                        href={`/messages?with=${tab === 'client' ? booking.provider?.id : booking.client?.id}&title=${encodeURIComponent(booking.service?.name ?? 'booking')}`}
                        style={{
                          padding: '8px 16px', background: '#f8f8f8', color: '#111',
                          fontWeight: 700, fontSize: '12px', textDecoration: 'none',
                          border: '1px solid #ddd',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          MESSAGE
                        </span>
                      </Link>
                    )}

                    {/* Service link */}
                    <Link
                      href={`/services/${booking.service?.id}`}
                      style={{ marginLeft: 'auto', fontSize: '12px', color: '#888', textDecoration: 'none', fontWeight: 600 }}
                    >
                      View service →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionWrapper>
    </>
  )
}
