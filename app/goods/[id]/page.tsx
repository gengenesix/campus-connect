"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { timeAgo } from '@/lib/utils'

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
  status: string
  in_stock: boolean
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

/** Normalise a WhatsApp number to international format (no +) for wa.me */
function toWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // Ghana: 0XXXXXXXXX → 233XXXXXXXXX
  if (digits.startsWith('0') && digits.length === 10) return '233' + digits.slice(1)
  // Already has 233 prefix
  if (digits.startsWith('233')) return digits
  // Has + (already stripped above), just return digits
  return digits
}

export default function GoodDetailPage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<RelatedProduct[]>([])
  const [views, setViews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, price, condition, category, image_url, views, description, created_at, whatsapp, status, in_stock,
          seller:profiles!seller_id (id, name, avatar_url, rating, is_verified, phone)
        `)
        .eq('id', params.id)
        .neq('status', 'deleted')
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return }

      const p = data as unknown as Product
      setProduct(p)
      setViews(p.views)

      // Increment views (fire-and-forget)
      supabase.rpc('increment_product_views', { product_id: params.id })

      // Related items (same category, active only)
      const { data: relatedData } = await supabase
        .from('products')
        .select('id, title, price, image_url')
        .eq('category', p.category)
        .eq('status', 'active')
        .neq('id', params.id)
        .limit(3)

      setRelated((relatedData as RelatedProduct[]) ?? [])
      setLoading(false)
    }

    if (params.id) fetchProduct()
  }, [params.id])

  // Live view counter via Supabase Realtime
  useEffect(() => {
    if (!params.id) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase
      .channel(`product_views:${params.id}`)
      .on(
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${params.id}` },
        (payload: any) => {
          if (typeof payload.new?.views === 'number') setViews(payload.new.views)
        }
      )
      .subscribe()

    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
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
  const rawWa = product.whatsapp || product.seller?.phone || ''
  const waNumber = rawWa ? toWaNumber(rawWa) : ''
  const whatsappMsg = `Hi, I'm interested in your listing: ${product.title} on Campus Connect`
  const whatsappHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappMsg)}` : null
  const isMine = user?.id === product.seller?.id
  const isPending = product.status === 'pending'

  const handleInAppMessage = () => {
    if (!user) { router.push(`/auth/login?redirect=/goods/${product.id}`); return }
    if (product.seller?.id) router.push(`/messages?with=${product.seller.id}&product=${product.id}&title=${encodeURIComponent(product.title)}`)
  }

  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>

      {/* Pending review banner */}
      {isPending && (
        <div style={{ background: '#fff8e1', borderBottom: '3px solid #f59e0b', padding: '12px 20px', textAlign: 'center' }}>
          <span style={{ fontWeight: 700, color: '#92400e', fontSize: '14px' }}>
            ⏳ This listing is under admin review. It will become visible once approved.
          </span>
        </div>
      )}

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
            <div style={{ border: '3px solid #111', overflow: 'hidden', background: '#fff', boxShadow: '8px 8px 0 #111', position: 'relative', height: '460px' }}>
              <Image
                src={product.image_url ?? '/placeholder.jpg'}
                alt={product.title}
                fill priority
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 55vw"
                onError={(e: any) => { e.currentTarget.src = '/placeholder.jpg' }}
              />
              {!product.in_stock && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ background: '#dc2626', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', letterSpacing: '1px', padding: '10px 28px', border: '3px solid #fff' }}>OUT OF STOCK</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 14px', background: condition.bg, color: condition.text, fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #111' }}>
                {product.condition.toUpperCase()}
              </span>
              <span style={{ padding: '6px 14px', background: '#f0f0f0', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #ddd' }}>
                {product.category.toUpperCase()}
              </span>
              <span style={{
                padding: '6px 14px', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #111',
                background: product.in_stock ? '#dcfce7' : '#fee2e2',
                color: product.in_stock ? '#15803d' : '#dc2626',
              }}>
                {product.in_stock ? '✓ IN STOCK' : '✕ OUT OF STOCK'}
              </span>
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #eee', color: '#888' }}>
                👁 {views} views
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
                  <Image
                    src={product.seller.avatar_url} alt={product.seller.name}
                    width={52} height={52}
                    style={{ borderRadius: '50%', border: '2px solid #111', objectFit: 'cover' }}
                    onError={(e: any) => { e.currentTarget.src = '/placeholder-user.jpg' }}
                  />
                ) : (
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', border: '2px solid #111' }}>
                    {(product.seller?.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px' }}>{product.seller?.name ?? 'UMaT Student'}</span>
                    {product.seller?.is_verified && (
                      <span title="Verified seller" style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '20px', height: '20px', background: '#1d9bf0', borderRadius: '50%',
                        fontSize: '11px', color: '#fff', fontWeight: 900, flexShrink: 0,
                        boxShadow: '0 1px 4px rgba(29,155,240,0.5)',
                      }}>✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
                    {product.seller?.rating ? `⭐ ${product.seller.rating.toFixed(1)}/5` : '★ New seller'} · UMaT Student
                  </div>
                  {product.seller?.id && !isMine && (
                    <Link
                      href={`/profile/${product.seller.id}`}
                      style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', fontWeight: 700, color: '#1B5E20', textDecoration: 'none', letterSpacing: '0.5px', borderBottom: '1px solid #1B5E20' }}
                    >
                      VIEW PROFILE →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {!isMine && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {/* In-app message button */}
                <button
                  onClick={handleInAppMessage}
                  className="btn-primary hover-lift"
                  style={{ width: '100%', padding: '16px 40px', fontFamily: '"Archivo Black", sans-serif', fontSize: '15px', border: '2px solid #111', boxShadow: '4px 4px 0 #111', cursor: 'pointer', letterSpacing: '0.5px', background: '#111', color: '#fff' }}
                >
                  💬 MESSAGE SELLER
                </button>

                {/* WhatsApp button */}
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textAlign: 'center', display: 'block', textDecoration: 'none',
                      padding: '14px 40px', background: '#25D366', color: '#fff',
                      fontFamily: '"Archivo Black", sans-serif', fontSize: '14px',
                      border: '2px solid #111', boxShadow: '4px 4px 0 #111',
                      letterSpacing: '0.5px',
                    }}
                  >
                    📱 CHAT ON WHATSAPP
                  </a>
                ) : !user ? (
                  <Link
                    href={`/auth/login?redirect=/goods/${product.id}`}
                    style={{
                      textAlign: 'center', display: 'block', textDecoration: 'none',
                      padding: '14px 40px', background: '#888', color: '#fff',
                      fontFamily: '"Archivo Black", sans-serif', fontSize: '14px',
                      border: '2px solid #111', boxShadow: '4px 4px 0 #111', letterSpacing: '0.5px',
                    }}
                  >
                    🔒 LOGIN TO CONTACT SELLER
                  </Link>
                ) : null}

                <Link href="/goods" className="btn-secondary hover-lift" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px' }}>
                  ← BACK TO LISTINGS
                </Link>
              </div>
            )}

            {isMine && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '2px solid #1B5E20', fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                  ✓ This is your listing
                </div>
                <Link href="/my-listings" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
                  MANAGE MY LISTINGS →
                </Link>
              </div>
            )}

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
              <Link href="/goods" style={{ color: '#111', fontWeight: 700, textDecoration: 'underline', fontSize: '14px' }}>See All</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {related.map(g => (
                <Link key={g.id} href={`/goods/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div
                    style={{ border: '2px solid #eee', background: '#fff', overflow: 'hidden', transition: '0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#111'; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #111' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#eee'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                      <Image src={g.image_url ?? '/placeholder.jpg'} alt={g.title} fill style={{ objectFit: 'cover' }} sizes="33vw" onError={(e: any) => { e.currentTarget.src = '/placeholder.jpg' }} />
                    </div>
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
