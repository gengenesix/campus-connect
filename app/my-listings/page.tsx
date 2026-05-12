"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import SectionWrapper from '@/components/ui/SectionWrapper'
import { useMyListings } from '@/hooks/useMyListings'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:  { bg: '#dcfce7', color: '#15803d' },
  pending: { bg: '#fff8e1', color: '#92400e' },
  sold:    { bg: '#e0e7ff', color: '#4338ca' },
  paused:  { bg: '#f3f4f6', color: '#6b7280' },
}

export default function MyListingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { listings, loading, togglingId, deletingId, toast, handleDelete, handleToggleStatus, handleToggleStock } = useMyListings()

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/my-listings')
  }, [user, authLoading, router])

  const totalViews = listings.reduce((s, l) => s + (l.views ?? 0), 0)
  const activeCount = listings.filter(l => l.status === 'active').length
  const pendingCount = listings.filter(l => l.status === 'pending').length
  const sortedByViews = [...listings].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
  const topPerformer = sortedByViews[0] ?? null
  const maxViews = topPerformer?.views ?? 0

  if (authLoading || (loading && !listings.length)) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
    </div>
  )

  return (
    <>

      {/* Toast */}
      {toast && (
        <div style={{ background: '#dcfce7', borderBottom: '2px solid #16a34a', padding: '8px 20px', textAlign: 'center', fontWeight: 700, fontSize: '13px', color: '#15803d' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>MY LISTINGS</div>
              <p style={{ color: '#888', marginTop: '4px', fontSize: '14px' }}>Manage your items and track performance</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/sell" style={{ padding: '12px 24px', background: '#1B5E20', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', textDecoration: 'none', border: '2px solid #1B5E20', boxShadow: '3px 3px 0 #fff' }}>
                + SELL ITEM
              </Link>
              <Link href="/offer-service" style={{ padding: '12px 24px', background: '#5d3fd3', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', textDecoration: 'none', border: '2px solid #5d3fd3', boxShadow: '3px 3px 0 #fff' }}>
                + OFFER SERVICE
              </Link>
            </div>
          </div>
        </div>
      </div>

      <SectionWrapper className="bg-[#f8f8f8]">

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Listings', value: listings.length, color: '#111' },
            { label: 'Active', value: activeCount, color: '#1B5E20' },
            { label: 'Pending', value: pendingCount, color: '#f59e0b' },
            { label: 'Total Views', value: totalViews, color: '#5d3fd3' },
            { label: 'Sold', value: listings.filter(l => l.status === 'sold').length, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{ border: '2px solid #111', background: '#fff', padding: '20px', boxShadow: '4px 4px 0 #111', textAlign: 'center' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '6px', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Performance analytics */}
        {listings.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', letterSpacing: '1.5px', marginBottom: '14px', color: '#111', borderBottom: '3px solid #111', paddingBottom: '8px' }}>
              PERFORMANCE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>

              {/* Top Performer */}
              <div style={{ border: '2px solid #111', background: '#fff', padding: '16px', boxShadow: '4px 4px 0 #5d3fd3' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', color: '#5d3fd3', marginBottom: '12px' }}>TOP PERFORMER</div>
                {topPerformer ? (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {topPerformer.image_url ? (
                      <Image src={topPerformer.image_url} alt={topPerformer.title} width={52} height={52} style={{ objectFit: 'cover', border: '2px solid #111', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '52px', height: '52px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #eee', color: '#ccc' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <Link href={`/goods/${topPerformer.id}`} style={{ fontWeight: 700, fontSize: '12px', color: '#111', textDecoration: 'none', display: 'block', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {topPerformer.title}
                      </Link>
                      <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '28px', color: '#5d3fd3', lineHeight: 1 }}>
                        {topPerformer.views ?? 0}
                      </div>
                      <div style={{ fontSize: '10px', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>VIEWS</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#888' }}>No listings yet</div>
                )}
              </div>

              {/* Views bar chart */}
              <div style={{ border: '2px solid #111', background: '#fff', padding: '16px', boxShadow: '4px 4px 0 #111' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', color: '#888', marginBottom: '12px' }}>
                  VIEWS BY LISTING
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {sortedByViews.slice(0, 8).map(listing => {
                    const pct = maxViews > 0 ? Math.max((listing.views / maxViews) * 100, listing.views > 0 ? 2 : 0) : 0
                    return (
                      <div key={listing.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0, height: '22px', background: '#f0f0f0', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: '#5d3fd3', transition: 'width 0.5s ease' }} />
                          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 700, color: pct > 35 ? '#fff' : '#111', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '85%', textOverflow: 'ellipsis' }}>
                            {listing.title}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#5d3fd3', width: '28px', textAlign: 'right', flexShrink: 0 }}>
                          {listing.views ?? 0}
                        </span>
                      </div>
                    )
                  })}
                  {listings.length > 8 && (
                    <div style={{ fontSize: '11px', color: '#888', paddingTop: '4px' }}>
                      + {listings.length - 8} more listings
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending notice */}
        {pendingCount > 0 && (
          <div style={{ background: '#fff8e1', border: '2px solid #f59e0b', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#92400e', fontWeight: 600, display: 'flex', gap: '8px' }}>
            <span>⏳</span>
            <span>{pendingCount} listing{pendingCount !== 1 ? 's' : ''} awaiting admin approval. Items become visible once approved.</span>
          </div>
        )}

        {/* Listings */}
        {listings.length === 0 ? (
          <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '6px 6px 0 #111', padding: '60px', textAlign: 'center' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', color: '#ddd' }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '24px', marginBottom: '12px' }}>No listings yet</div>
            <p style={{ color: '#888', marginBottom: '28px' }}>List your first item and start connecting with fellow students.</p>
            <Link href="/sell" style={{ display: 'inline-block', padding: '14px 32px', background: '#1B5E20', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
              LIST YOUR FIRST ITEM →
            </Link>
          </div>
        ) : (
          <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '6px 6px 0 #111', overflow: 'hidden' }}>
            {/* Desktop table */}
            <div className="listings-table-wrap" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#111', color: '#fff' }}>
                    {['ITEM', 'PRICE', 'CONDITION', 'VIEWS', 'STATUS', 'STOCK', 'ACTIONS'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontFamily: '"Archivo Black", sans-serif', fontSize: '11px', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing, i) => {
                    const sc = STATUS_COLORS[listing.status] || { bg: '#f3f4f6', color: '#666' }
                    const isPending = listing.status === 'pending'
                    return (
                      <tr key={listing.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {listing.image_url ? (
                              <Image src={listing.image_url} alt={listing.title} width={44} height={44} style={{ objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '44px', height: '44px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ccc' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
                            )}
                            <div>
                              <Link href={`/goods/${listing.id}`} style={{ fontWeight: 700, fontSize: '13px', textDecoration: 'none', color: '#111', display: 'block' }}>{listing.title}</Link>
                              <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>
                                {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', color: '#5d3fd3', whiteSpace: 'nowrap' }}>
                          GHS {listing.price.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: '#f0f0f0', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>{listing.condition}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#666' }}>
                          {listing.views ?? 0}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {isPending ? (
                            <span style={{ background: sc.bg, color: sc.color, fontSize: '10px', fontWeight: 800, padding: '4px 10px', border: `1px solid ${sc.color}44`, whiteSpace: 'nowrap' }}>
                              ⏳ PENDING
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(listing)}
                              disabled={togglingId === listing.id}
                              style={{
                                padding: '4px 10px', fontSize: '10px', fontWeight: 800, cursor: 'pointer',
                                background: sc.bg, color: sc.color,
                                border: `1px solid ${sc.color}44`, letterSpacing: '0.5px',
                                opacity: togglingId === listing.id ? 0.5 : 1,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {listing.status.toUpperCase()}
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            onClick={() => handleToggleStock(listing)}
                            disabled={isPending || togglingId === listing.id + '_stock'}
                            title={isPending ? 'Awaiting approval' : 'Toggle stock status'}
                            style={{
                              padding: '4px 10px', fontSize: '10px', fontWeight: 800, cursor: isPending ? 'not-allowed' : 'pointer',
                              background: listing.in_stock ? '#dcfce7' : '#fee2e2',
                              color: listing.in_stock ? '#15803d' : '#dc2626',
                              border: `1px solid ${listing.in_stock ? '#86efac' : '#fca5a5'}`,
                              opacity: isPending ? 0.5 : 1, whiteSpace: 'nowrap',
                            }}
                          >
                            {listing.in_stock ? '✓ IN STOCK' : '✕ OUT'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Link href={`/goods/${listing.id}`} style={{ fontSize: '12px', fontWeight: 700, color: '#5d3fd3', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                              View
                            </Link>
                            <button
                              onClick={() => handleDelete(listing.id)}
                              disabled={deletingId === listing.id}
                              style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: deletingId === listing.id ? 'not-allowed' : 'pointer', opacity: deletingId === listing.id ? 0.5 : 1, fontFamily: '"Space Grotesk", sans-serif', whiteSpace: 'nowrap' }}
                            >
                              {deletingId === listing.id ? '...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionWrapper>
    </>
  )
}
