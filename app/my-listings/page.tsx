"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface Listing {
  id: string
  title: string
  price: number
  category: string
  condition: string
  status: string
  image_url: string | null
  views: number
  in_stock: boolean
  created_at: string
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:  { bg: '#dcfce7', color: '#15803d' },
  pending: { bg: '#fff8e1', color: '#92400e' },
  sold:    { bg: '#e0e7ff', color: '#4338ca' },
  paused:  { bg: '#f3f4f6', color: '#6b7280' },
}

export default function MyListingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/my-listings')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const fetchListings = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('id, title, price, category, condition, status, image_url, views, in_stock, created_at')
        .eq('seller_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
      setListings(data ?? [])
      setLoading(false)
    }
    fetchListings()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeletingId(id)
    const { error } = await supabase
      .from('products')
      .update({ status: 'deleted' })
      .eq('id', id)
      .eq('seller_id', user!.id)
    if (!error) {
      setListings(prev => prev.filter(l => l.id !== id))
      showToast('Listing deleted.')
    } else {
      showToast('Error: ' + error.message)
    }
    setDeletingId(null)
  }

  const handleToggleStatus = async (listing: Listing) => {
    if (listing.status === 'pending') return // Admin must approve first
    const newStatus = listing.status === 'active' ? 'sold' : 'active'
    setTogglingId(listing.id)
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', listing.id)
      .eq('seller_id', user!.id)
    if (!error) {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l))
    }
    setTogglingId(null)
  }

  const handleToggleStock = async (listing: Listing) => {
    if (listing.status === 'pending') return
    const newStock = !listing.in_stock
    setTogglingId(listing.id + '_stock')
    const { error } = await supabase
      .from('products')
      .update({ in_stock: newStock })
      .eq('id', listing.id)
      .eq('seller_id', user!.id)
    if (!error) {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, in_stock: newStock } : l))
      showToast(newStock ? '✓ Marked as in stock' : 'Marked as out of stock')
    }
    setTogglingId(null)
  }

  const totalViews = listings.reduce((s, l) => s + (l.views ?? 0), 0)
  const activeCount = listings.filter(l => l.status === 'active').length
  const pendingCount = listings.filter(l => l.status === 'pending').length

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
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>

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

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '80px' }}>

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
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
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
                              <div style={{ width: '44px', height: '44px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📦</div>
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
      </div>
    </div>
  )
}
