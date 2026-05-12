import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createSupabaseReadClient } from '@/lib/supabase-server'
import { timeAgo } from '@/lib/utils'
import GoodsActionsClient from './GoodsActionsClient'
import ImageGallery from '@/components/ImageGallery'
import ReviewsSection from '@/components/ReviewsSection'
import SectionWrapper from '@/components/ui/SectionWrapper'

export const revalidate = 60

type Params = Promise<{ id: string }>

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

function toWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) return '233' + digits.slice(1)
  if (digits.startsWith('233')) return digits
  return digits
}

const conditionColors: Record<string, { bg: string; text: string }> = {
  'New':      { bg: '#1B5E20', text: '#fff' },
  'Like New': { bg: '#1565C0', text: '#fff' },
  'Good':     { bg: '#E65100', text: '#fff' },
  'Fair':     { bg: '#6D4C41', text: '#fff' },
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params
  const supabase = createSupabaseReadClient()
  const { data } = await supabase
    .from('products')
    .select('title, description, image_url, price')
    .eq('id', id)
    .neq('status', 'deleted')
    .single()

  if (!data) return { title: 'Listing Not Found — Campus Connect' }

  return {
    title: `${data.title} — Campus Connect`,
    description: (data.description ?? `Buy ${data.title} on Campus Connect Ghana`).slice(0, 155),
    openGraph: {
      title: data.title,
      description: (data.description ?? '').slice(0, 155),
      images: data.image_url ? [{ url: data.image_url }] : [],
    },
  }
}

export default async function GoodDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = createSupabaseReadClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, title, price, condition, category, image_url, views, description, created_at, whatsapp, status, in_stock,
      seller:profiles!seller_id (id, name, avatar_url, rating, is_verified, phone)
    `)
    .eq('id', id)
    .neq('status', 'deleted')
    .single()

  if (error || !data) notFound()

  const product = data as unknown as Product
  const isPending = product.status === 'pending'

  const { data: productImagesData } = await supabase
    .from('product_images')
    .select('image_url')
    .eq('product_id', id)
    .order('display_order', { ascending: true })

  const galleryImages = [
    ...(product.image_url ? [{ url: product.image_url, alt: product.title }] : []),
    ...((productImagesData ?? []) as { image_url: string }[]).map(img => ({ url: img.image_url, alt: product.title })),
  ]

  const { data: related } = await supabase
    .from('products')
    .select('id, title, price, image_url')
    .eq('category', product.category)
    .eq('status', 'active')
    .neq('id', id)
    .limit(3)

  const cond = conditionColors[product.condition] ?? { bg: '#111', text: '#fff' }

  const rawWa = product.whatsapp || product.seller?.phone || ''
  const waNumber = rawWa ? toWaNumber(rawWa) : ''
  const whatsappMsg = `Hi, I'm interested in your listing: ${product.title} on Campus Connect`
  const whatsappHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappMsg)}` : null

  const relatedItems = (related ?? []) as { id: string; title: string; price: number; image_url: string | null }[]

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: galleryImages.map(g => g.url).filter(Boolean),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'GHS',
      price: product.price,
      availability: product.in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Person',
        name: product.seller?.name ?? 'Campus Seller',
      },
    },
    ...(product.seller?.rating && product.seller.rating > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.seller.rating,
        ratingCount: 1,
        bestRating: 5,
      },
    } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

      <SectionWrapper className="bg-[#f8f8f8]">
        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '48px', alignItems: 'start' }}>

          {/* LEFT — Image */}
          <div>
            <div style={{ position: 'relative' }}>
              <ImageGallery images={galleryImages} alt={product.title} height={460} />
              {!product.in_stock && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }}>
                  <span style={{ background: '#dc2626', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '16px', letterSpacing: '1px', padding: '10px 28px', border: '3px solid #fff' }}>OUT OF STOCK</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 14px', background: cond.bg, color: cond.text, fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #111' }}>
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
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #eee', color: '#888', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {product.views} views
              </span>
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #eee', color: '#888', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {timeAgo(product.created_at)}
              </span>
            </div>
          </div>

          {/* RIGHT — Info */}
          <div>
            <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '34px', lineHeight: 1.1, marginBottom: '16px', color: '#111', letterSpacing: '-0.5px' }}>
              {product.title}
            </h1>

            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '44px', color: '#5d3fd3', marginBottom: '20px', lineHeight: 1 }}>
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
                    src={product.seller.avatar_url}
                    alt={product.seller.name}
                    width={52} height={52}
                    style={{ borderRadius: '50%', border: '2px solid #111', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', border: '2px solid #111' }}>
                    {(product.seller?.name ?? 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px' }}>{product.seller?.name ?? 'Student'}</span>
                    {product.seller?.is_verified && (
                      <span title="Verified seller" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', background: '#1d9bf0', borderRadius: '50%', fontSize: '11px', color: '#fff', fontWeight: 900, flexShrink: 0 }}>✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
                    {product.seller?.rating ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{product.seller.rating.toFixed(1)}/5</> : '★ New seller'} · Campus Seller
                  </div>
                  {product.seller?.id && (
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

            {/* Interactive actions (client-rendered) */}
            <GoodsActionsClient
              productId={product.id}
              sellerId={product.seller?.id ?? null}
              whatsappHref={whatsappHref}
              productTitle={product.title}
            />

            <div style={{ padding: '14px 16px', background: '#fffbeb', border: '2px solid #f59e0b', fontSize: '13px', color: '#92400e', lineHeight: 1.5 }}>
              <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                <span><strong>Safety tip:</strong> Always meet in a public place on campus (library, SRC). Never transfer money before seeing the item in person.</span>
              </span>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {product.seller?.id && (
          <ReviewsSection productId={product.id} revieweeId={product.seller.id} />
        )}

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid #111' }}>
            <div className="trending-header" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', textTransform: 'uppercase' }}>
                More {product.category}
              </h3>
              <Link href="/goods" style={{ color: '#111', fontWeight: 700, textDecoration: 'underline', fontSize: '14px' }}>See All</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {relatedItems.map(g => (
                <Link key={g.id} href={`/goods/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ border: '2px solid #eee', background: '#fff', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                      <Image src={g.image_url ?? '/placeholder.jpg'} alt={g.title} fill style={{ objectFit: 'cover' }} sizes="33vw" />
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
      </SectionWrapper>
    </>
  )
}
