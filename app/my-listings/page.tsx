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
  created_at: string
}

export default function MyListingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/my-listings')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const fetchListings = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('id, title, price, category, condition, status, image_url, views, created_at')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
      setListings(data ?? [])
      setLoading(false)
    }
    fetchListings()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    setDeleting(id)
    await supabase.from('products').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeleting(null)
  }

  const handleToggleStatus = async (listing: Listing) => {
    const newStatus = listing.status === 'active' ? 'sold' : 'active'
    await supabase.from('products').update({ status: newStatus }).eq('id', listing.id)
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l))
  }

  const totalViews = listings.reduce((sum, l) => sum + (l.views ?? 0), 0)
  const activeCount = listings.filter(l => l.status === 'active').length

  if (authLoading || (loading && !listings.length)) {
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
                MY LISTINGS
              </div>
              <p style={{ color: '#888', marginTop: '4px', fontSize: '14px' }}>
                Manage your items and track performance
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Listings', value: listings.length, color: '#111' },
            { label: 'Active', value: activeCount, color: '#1B5E20' },
            { label: 'Total Views', value: totalViews, color: '#5d3fd3' },
            { label: 'Sold', value: listings.filter(l => l.status === 'sold').length, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{ border: '2px solid #111', background: '#fff', padding: '20px', boxShadow: '4px 4px 0 #111', textAlign: 'center' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#111', color: '#fff' }}>
                  {['ITEM', 'PRICE', 'CATEGORY', 'CONDITION', 'VIEWS', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontFamily: '"Archivo Black", sans-serif', fontSize: '11px', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listings.map((listing, i) => (
                  <tr key={listing.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {listing.image_url ? (
                          <Image src={listing.image_url} alt={listing.title} width={48} height={48} style={{ objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📦</div>
                        )}
                        <div>
                          <Link href={`/goods/${listing.id}`} style={{ fontWeight: 700, fontSize: '13px', textDecoration: 'none', color: '#111', display: 'block' }}>{listing.title}</Link>
                          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                            {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: '"Archivo Black", sans-serif', fontSize: '15px', color: '#5d3fd3', whiteSpace: 'nowrap' }}>
                      GHS {listing.price.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#666' }}>{listing.category}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: '#f0f0f0', padding: '3px 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                        {listing.condition}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#666' }}>{listing.views ?? 0}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleToggleStatus(listing)}
                        style={{
                          padding: '4px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', border: 'none', cursor: 'pointer',
                          background: listing.status === 'active' ? '#e8f5e9' : '#f0f0f0',
                          color: listing.status === 'active' ? '#1B5E20' : '#888',
                          border: `1px solid ${listing.status === 'active' ? '#86efac' : '#ddd'}`,
                        }}
                      >
                        {listing.status === 'active' ? 'ACTIVE' : 'SOLD'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/goods/${listing.id}`} style={{ fontSize: '12px', fontWeight: 700, color: '#5d3fd3', textDecoration: 'none' }}>
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleting === listing.id}
                          style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: deleting === listing.id ? 'not-allowed' : 'pointer', opacity: deleting === listing.id ? 0.5 : 1, fontFamily: '"Space Grotesk", sans-serif' }}
                        >
                          {deleting === listing.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
