"use client"

import Link from 'next/link'
import { mockGoods } from '@/lib/mockData'
import { notFound, useParams } from 'next/navigation'

const conditionColors: Record<string, { bg: string; text: string }> = {
  'New':      { bg: '#1B5E20', text: '#fff' },
  'Like New': { bg: '#1565C0', text: '#fff' },
  'Good':     { bg: '#E65100', text: '#fff' },
  'Fair':     { bg: '#6D4C41', text: '#fff' },
}

export default function GoodDetailPage() {
  const params = useParams<{ id: string }>()
  const good = mockGoods.find(g => g.id === params.id)
  if (!good) notFound()

  const condition = conditionColors[good.condition] || { bg: '#111', text: '#fff' }
  const related = mockGoods.filter(g => g.id !== good.id && g.category === good.category).slice(0, 3)

  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#111', padding: '12px 20px' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#666' }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/goods" style={{ color: '#666', textDecoration: 'none' }}>Goods</Link>
          <span>›</span>
          <span style={{ color: '#a78bfa' }}>{good.name}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '48px', alignItems: 'start' }}>

          {/* LEFT — Image */}
          <div>
            <div style={{ border: '3px solid #111', overflow: 'hidden', background: '#fff', boxShadow: '8px 8px 0 #111' }}>
              <img
                src={good.image}
                alt={good.name}
                style={{ width: '100%', height: '460px', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.currentTarget.src = '/placeholder.jpg' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 14px', background: condition.bg, color: condition.text, fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #111' }}>
                {good.condition.toUpperCase()}
              </span>
              <span style={{ padding: '6px 14px', background: '#f0f0f0', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #ddd' }}>
                {good.category.toUpperCase()}
              </span>
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #eee', color: '#888' }}>
                👁 {good.views} views
              </span>
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #eee', color: '#888' }}>
                🕐 {good.createdAt}
              </span>
            </div>
          </div>

          {/* RIGHT — Info */}
          <div>
            <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '34px', lineHeight: 1.1, marginBottom: '16px', color: '#111', letterSpacing: '-0.5px' }}>
              {good.name}
            </h1>

            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '44px', color: '#5d3fd3', marginBottom: '20px', lineHeight: 1 }}>
              GHS {good.price}
            </div>

            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#444', marginBottom: '28px', paddingLeft: '16px', borderLeft: '4px solid #111' }}>
              {good.description}
            </p>

            {/* Seller Card */}
            <div style={{ border: '2px solid #111', padding: '20px', background: '#fff', marginBottom: '20px', boxShadow: '4px 4px 0 #111' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '12px', color: '#888' }}>SELLER</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={good.sellerImage}
                  alt={good.seller}
                  style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #111', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.src = '/placeholder-user.jpg' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>{good.seller}</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>⭐ {good.sellerRating}/5 · UMaT Student</div>
                </div>
                <div style={{ marginLeft: 'auto', background: '#e8f5e9', color: '#1B5E20', padding: '4px 12px', fontSize: '11px', fontWeight: 700, border: '1px solid #1B5E20' }}>
                  VERIFIED
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <a
                href={`https://wa.me/?text=Hi%20${encodeURIComponent(good.seller)}%2C%20I%27m%20interested%20in%20your%20listing%3A%20${encodeURIComponent(good.name)}%20on%20Campus%20Connect`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary hover-lift"
                style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '16px 40px' }}
              >
                💬 MESSAGE SELLER
              </a>
              <Link
                href="/goods"
                className="btn-secondary hover-lift"
                style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '16px 40px' }}
              >
                ← BACK TO LISTINGS
              </Link>
            </div>

            {/* Safety Notice */}
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
                More {good.category}
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
                    <img src={g.image} alt={g.name} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} onError={(e) => { e.currentTarget.src = '/placeholder.jpg' }} />
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{g.name}</div>
                      <div style={{ fontFamily: '"Archivo Black"', fontSize: '18px', color: '#5d3fd3' }}>GHS {g.price}</div>
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
