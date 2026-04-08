"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface Product {
  id: string
  title: string
  price: number
  condition: string
  category: string
  image_url: string | null
  views: number
  description: string
  created_at: string
  whatsapp: string | null
  seller: {
    id: string
    name: string
    avatar_url: string | null
    rating: number
    is_verified: boolean
    phone: string | null
  } | null
}

interface RelatedProduct {
  id: string
  title: string
  price: number
  image_url: string | null
}

const conditionColors: Record<string, { bg: string; text: string }> = {
  'New':      { bg: '#1B5E20', text: '#fff' },
  'Like New': { bg: '#1565C0', text: '#fff' },
  'Good':     { bg: '#E65100', text: '#fff' },
  'Fair':     { bg: '#6D4C41', text: '#fff' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

export default function GoodDetailPage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, price, condition, category, image_url, views, description, created_at, whatsapp,
          seller:profiles!seller_id (id, name, avatar_url, rating, is_verified, phone)
        `)
        .eq('id', params.id)
        .neq('status', 'deleted')
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const p = data as Product
      setProduct(p)

      // Increment views
      supabase.rpc('increment_product_views', { product_id: params.id })

      // Fetch related items (same category)
      const { data: relatedData } = await supabase
        .from('products')
        .select('id, title, price, image_url')
        .eq('category', p.category)
        .neq('id', params.id)
        .neq('status', 'deleted')
        .limit(3)

      setRelated((relatedData as RelatedProduct[]) ?? [])
      setLoading(false)
    }

    if (params.id) fetchProduct()
  }, [params.id])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px' }}>NOT FOUND</div>
        <p style={{ color: '#888' }}>This listing may have been removed or sold.</p>
        <Link href="/goods" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px' }}>← BACK TO LISTINGS</Link>
      </div>
    )
  }

  const condition = conditionColors[product.condition] || { bg: '#111', text: '#fff' }
  const whatsappMsg = `Hi, I'm interested in your listing: ${product.title} on Campus Connect`
  const whatsappHref = product.whatsapp
    ? `https://wa.me/${product.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`

  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#111', padding: '12px 20px' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#666' }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/goods" style={{ color: '#666', textDecoration: 'none' }}>Goods</Link>
          <span>›</span>
          <span style={{ color: '#a78bfa' }}>{product.title}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '48px', alignItems: 'start' }}>

          {/* LEFT — Image */}
          <div>
            <div style={{ border: '3px solid #111', overflow: 'hidden', background: '#fff', boxShadow: '8px 8px 0 #111' }}>
              <img
                src={product.image_url ?? '/placeholder.jpg'}
                alt={product.title}
                style={{ width: '100%', height: '460px', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.currentTarget.src = '/placeholder.jpg' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 14px', background: condition.bg, color: condition.text, fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #111' }}>
                {product.condition.toUpperCase()}
              </span>
              <span style={{ padding: '6px 14px', background: '#f0f0f0', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #ddd' }}>
                {product.category.toUpperCase()}
              </span>
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #eee', color: '#888' }}>
                👁 {product.views} views
              </span>
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #eee', color: '#888' }}>
                🕐 {timeAgo(product.created_at)}
              </span>
            </div>
          </div>

          {/* RIGHT — Info */}
          <div>
            <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '34px', lineHeight: 1.1, marginBottom: '16px', color: '#111', letterSpacing: '-0.5px' }}>
              {product.title}
            </h1>

            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '44px', color: '#5d3fd3', marginBottom: '20px', lineHeight: 1 }}>
              GHS {product.price.toLocaleString()}
            </div>

            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#444', marginBottom: '28px', paddingLeft: '16px', borderLeft: '4px solid #111' }}>
              {product.description}
            </p>

            {/* Seller Card */}
            <div style={{ border: '2px solid #111', padding: '20px', background: '#fff', marginBottom: '20px', boxShadow: '4px 4px 0 #111' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '12px', color: '#888' }}>SELLER</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {product.seller?.avatar_url ? (
                  <img
                    src={product.seller.avatar_url}
                    alt={product.seller.name}
                    style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #111', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = '/placeholder-user.jpg' }}
                  />
                ) : (
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', border: '2px solid #111' }}>
                    {(product.seller?.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>{product.seller?.name ?? 'UMaT Student'}</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>⭐ {product.seller?.rating?.toFixed(1) ?? '5.0'}/5 · UMaT Student</div>
                </div>
                {product.seller?.is_verified && (
                  <div style={{ marginLeft: 'auto', background: '#e8f5e9', color: '#1B5E20', padding: '4px 12px', fontSize: '11px', fontWeight: 700, border: '1px solid #1B5E20' }}>
                    VERIFIED
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {user ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary hover-lift"
                  style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '16px 40px' }}
                >
                  💬 MESSAGE SELLER
                </a>
              ) : (
                <Link
                  href={`/auth/login?redirect=/goods/${product.id}`}
                  style={{
                    textAlign: 'center', display: 'block', textDecoration: 'none',
                    padding: '16px 40px', background: '#888', color: '#fff',
                    fontFamily: '"Archivo Black", sans-serif', fontSize: '15px',
                    border: '2px solid #111', boxShadow: '4px 4px 0 #111',
                    letterSpacing: '0.5px',
                  }}
                >
                  🔒 LOGIN TO CONTACT SELLER
                </Link>
              )}
              <Link
                href="/goods"
                className="btn-secondary hover-lift"
                style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '16px 40px' }}
              >
                ← BACK TO LISTINGS
              </Link>
            </div>

            <div style={{ padding: '14px 16px', background: '#fffbeb', border: '2px solid #f59e0b', fontSize: '13px', color: '#92400e', lineHeight: 1.5 }}>
              🛡️ <strong>Safety tip:</strong> Always meet in a public place on campus (library, SRC). Never transfer money before seeing the item in person.
            </div>
          </div>
        </div>

        {/* Related Items */}
        {related.length > 0 && (
          <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid #111' }}>
            <div className="trending-header" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '22px', textTransform: 'uppercase' }}>
                More {product.category}
              </h3>
              <Link href="/goods" style={{ color: '#111', fontWeight: 700, textDecoration: 'underline', fontSize: '14px' }}>
                See All
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {related.map(g => (
                <Link key={g.id} href={`/goods/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ border: '2px solid #eee', background: '#fff', overflow: 'hidden', transition: '0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#111'; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #111' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#eee'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <img src={g.image_url ?? '/placeholder.jpg'} alt={g.title} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} onError={(e) => { e.currentTarget.src = '/placeholder.jpg' }} />
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{g.title}</div>
                      <div style={{ fontFamily: '"Archivo Black"', fontSize: '18px', color: '#5d3fd3' }}>GHS {g.price.toLocaleString()}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
