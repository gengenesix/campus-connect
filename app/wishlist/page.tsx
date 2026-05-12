"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import WishlistButton from '@/components/WishlistButton'
import SectionWrapper from '@/components/ui/SectionWrapper'

interface SavedItem {
  id: string
  created_at: string
  product: {
    id: string
    title: string
    price: number
    condition: string
    category: string
    image_url: string | null
    status: string
    seller: { name: string; avatar_url: string | null; is_verified: boolean; rating: number } | null
  } | null
  service: {
    id: string
    name: string
    rate: string | null
    category: string
    image_url: string | null
    status: string
    provider: { name: string; avatar_url: string | null; is_verified: boolean; rating: number } | null
  } | null
}

type Tab = 'all' | 'products' | 'services'

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [saved, setSaved] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/wishlist')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/wishlist')
      .then(r => r.json())
      .then(data => setSaved(data.saved ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const products = saved.filter(s => s.product)
  const services = saved.filter(s => s.service)
  const visible = tab === 'all' ? saved : tab === 'products' ? products : services

  if (authLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>
            MY WISHLIST
          </div>
          <p style={{ color: '#888', marginTop: '6px', fontSize: '14px' }}>
            Items and services you&apos;ve saved for later
          </p>
        </div>
      </div>

      <SectionWrapper className="bg-[#f8f8f8]">

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '3px solid #111' }}>
          {([
            { key: 'all', label: `ALL (${saved.length})` },
            { key: 'products', label: `GOODS (${products.length})` },
            { key: 'services', label: `SERVICES (${services.length})` },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 20px',
                fontFamily: '"Archivo Black", sans-serif',
                fontSize: '12px',
                letterSpacing: '0.5px',
                border: '2px solid #111',
                borderBottom: 'none',
                cursor: 'pointer',
                background: tab === t.key ? '#111' : '#fff',
                color: tab === t.key ? '#fff' : '#888',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888', fontFamily: '"Space Grotesk", sans-serif' }}>
            Loading your saved items...
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: '#ccc' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', marginBottom: '8px', color: '#111' }}>
              NOTHING SAVED YET
            </div>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              {tab === 'all' ? 'Save items and services you like by tapping the heart icon.' : `No saved ${tab} yet.`}
            </p>
            <Link
              href={tab === 'services' ? '/services' : '/goods'}
              style={{ display: 'inline-block', padding: '14px 32px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #a78bfa' }}
            >
              BROWSE {tab === 'services' ? 'SERVICES' : 'GOODS'} →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {visible.map(item => item.product ? (
              <ProductCard key={item.id} item={item} />
            ) : item.service ? (
              <ServiceCard key={item.id} item={item} />
            ) : null)}
          </div>
        )}
      </SectionWrapper>
    </>
  )
}

function ProductCard({ item }: { item: SavedItem }) {
  const p = item.product!
  const [imgSrc, setImgSrc] = useState(p.image_url ?? '/placeholder.jpg')
  return (
    <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Link href={`/goods/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: '#f0f0f0' }}>
          <Image src={imgSrc} alt={p.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 33vw" onError={() => setImgSrc('/placeholder.jpg')} />
          {p.status !== 'active' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ background: '#888', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '11px', padding: '6px 14px', letterSpacing: '0.5px' }}>UNAVAILABLE</span>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.35, marginBottom: '8px', color: '#111', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{p.title}</div>
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', color: '#5d3fd3', marginBottom: '4px' }}>GHS {p.price.toLocaleString()}</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', background: '#f0f0f0', color: '#555', border: '1px solid #eee' }}>{p.condition.toUpperCase()}</span>
            <span style={{ fontSize: '11px', color: '#888' }}>{p.seller?.name ?? 'Student'}</span>
          </div>
        </div>
      </Link>
      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
        <WishlistButton productId={p.id} initialSaved size={32} />
      </div>
    </div>
  )
}

function ServiceCard({ item }: { item: SavedItem }) {
  const s = item.service!
  const [imgSrc, setImgSrc] = useState(s.image_url ?? '/placeholder.jpg')
  return (
    <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #1B5E20', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Link href={`/services/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: '4px', background: '#1B5E20' }} />
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: '#f0f0f0' }}>
          <Image src={imgSrc} alt={s.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 33vw" onError={() => setImgSrc('/placeholder.jpg')} />
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.35, marginBottom: '8px', color: '#111', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{s.name}</div>
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', color: '#1B5E20', marginBottom: '4px' }}>{s.rate ?? 'Contact for pricing'}</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', background: '#e8f5e9', color: '#1B5E20', border: '1px solid #86efac' }}>{s.category.toUpperCase()}</span>
            <span style={{ fontSize: '11px', color: '#888' }}>{s.provider?.name ?? 'Provider'}</span>
          </div>
        </div>
      </Link>
      <div style={{ position: 'absolute', top: '14px', right: '10px' }}>
        <WishlistButton serviceId={s.id} initialSaved size={32} />
      </div>
    </div>
  )
}
