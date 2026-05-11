"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import type { Good } from '@/lib/mockData'
import WishlistButton from '@/components/WishlistButton'

const conditionMeta: Record<string, { bg: string; text: string }> = {
  'New':      { bg: '#1B5E20', text: '#fff' },
  'Like New': { bg: '#1565C0', text: '#fff' },
  'Good':     { bg: '#E65100', text: '#fff' },
  'Fair':     { bg: '#6D4C41', text: '#fff' },
}

function VerifiedBadge() {
  return (
    <span title="Verified by Campus Connect" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '14px', height: '14px', background: '#1d9bf0', borderRadius: '50%',
      fontSize: '8px', color: '#fff', fontWeight: 900, flexShrink: 0,
    }}>✓</span>
  )
}

export default function GoodsCard({ good }: { good: Good }) {
  const { user } = useAuth()
  const cond = conditionMeta[good.condition] || { bg: '#333', text: '#fff' }
  const [imgSrc, setImgSrc] = useState(good.image || '/placeholder.jpg')
  const [sellerImgSrc, setSellerImgSrc] = useState(good.sellerImage || '/placeholder-user.jpg')

  return (
    <Link href={`/goods/${good.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <div className="gc-card">
        {/* Image */}
        <div style={{ position: 'relative', height: '220px', overflow: 'hidden', background: '#f0f0f0', flexShrink: 0 }}>
          <Image
            src={imgSrc}
            alt={good.name}
            fill
            className="gc-img"
            style={{ objectFit: 'cover', transition: 'transform 0.45s ease' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgSrc('/placeholder.jpg')}
          />
          {/* Bottom gradient */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))', pointerEvents: 'none' }} />

          {/* Hover CTA overlay */}
          <div className="gc-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', pointerEvents: 'none' }}>
            <span className="gc-cta" style={{
              fontFamily: '"Archivo Black", sans-serif', fontSize: '12px',
              color: '#fff', letterSpacing: '1px', background: '#111', padding: '10px 20px',
              opacity: 0, transform: 'translateY(8px)', transition: 'opacity 0.2s, transform 0.2s',
            }}>
              VIEW ITEM →
            </span>
          </div>

          {/* Condition badge */}
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            background: cond.bg, color: cond.text,
            fontSize: '9px', fontWeight: 800, padding: '4px 9px',
            letterSpacing: '0.8px', fontFamily: '"Space Grotesk", sans-serif',
          }}>
            {good.condition.toUpperCase()}
          </span>

          {/* Views */}
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            fontSize: '10px', fontWeight: 600, padding: '3px 8px',
            fontFamily: '"Space Grotesk", sans-serif',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ display:'inline',verticalAlign:'middle',marginRight:'3px',opacity:.8 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{good.views}
          </span>

          {/* Wishlist button */}
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 2 }}>
            <WishlistButton productId={good.id} size={32} />
          </div>

          {/* Out of stock overlay */}
          {good.inStock === false && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <span style={{
                background: '#dc2626', color: '#fff',
                fontFamily: '"Archivo Black", sans-serif',
                fontSize: '13px', letterSpacing: '1px',
                padding: '8px 20px', border: '2px solid #fff',
              }}>OUT OF STOCK</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            fontWeight: 700, fontSize: '15px', lineHeight: 1.35, color: '#111',
            marginBottom: '10px', overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {good.name}
          </h3>

          {/* Seller row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <div style={{ position: 'relative', width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '1.5px solid #eee' }}>
              <Image
                src={sellerImgSrc}
                alt={good.seller}
                width={22}
                height={22}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                onError={() => setSellerImgSrc('/placeholder-user.jpg')}
              />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {good.seller}
            </span>
            {good.sellerVerified && <VerifiedBadge />}
            <span style={{ fontSize: '11px', color: good.sellerRating > 0 ? '#f59e0b' : '#ccc', flexShrink: 0 }}>
              {good.sellerRating > 0 ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" style={{display:'inline',verticalAlign:'middle',marginRight:'2px'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{good.sellerRating.toFixed(1)}</> : '★ New'}
            </span>
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ height: '1px', background: '#f0f0f0', margin: '0 0 12px' }} />

          {/* Price + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '21px', color: '#5d3fd3', lineHeight: 1 }}>
                GHS {good.price.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#bbb', marginTop: '3px' }}>{good.createdAt}</div>
            </div>
            <div style={{
              padding: '8px 16px', flexShrink: 0,
              background: user ? '#111' : '#f5f5f5',
              color: user ? '#fff' : '#999',
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px',
              border: user ? '2px solid #111' : '1px solid #ddd',
            }}>
              {user ? 'MSG →' : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>MSG</>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
