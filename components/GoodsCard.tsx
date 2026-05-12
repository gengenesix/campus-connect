"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import type { Good } from '@/lib/supabase'
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
        <div style={{ position: 'relative', height: '210px', overflow: 'hidden', background: '#F3F2EF', flexShrink: 0 }}>
          <Image
            src={imgSrc}
            alt={good.name}
            fill
            className="gc-img"
            style={{ objectFit: 'cover', transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)' }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgSrc('/placeholder.jpg')}
          />
          {/* Gradient */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '64px', background: 'linear-gradient(transparent, rgba(0,0,0,0.38))', pointerEvents: 'none' }} />

          {/* Hover CTA */}
          <div className="gc-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', pointerEvents: 'none' }}>
            <span className="gc-cta" style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '12px',
              color: '#fff', letterSpacing: '0.5px', background: '#1A1A1A',
              padding: '9px 18px', borderRadius: '6px',
              opacity: 0, transform: 'translateY(8px)', transition: 'opacity 0.2s, transform 0.2s',
            }}>
              View Item →
            </span>
          </div>

          {/* Condition badge */}
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            background: cond.bg, color: cond.text,
            fontSize: '9px', fontWeight: 700, padding: '3px 8px',
            borderRadius: '999px', fontFamily: '"Plus Jakarta Sans", sans-serif',
            letterSpacing: '0.4px',
          }}>
            {good.condition}
          </span>

          {/* Views */}
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.5)', color: '#fff',
            fontSize: '10px', fontWeight: 600, padding: '3px 8px',
            borderRadius: '999px', fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ display:'inline', verticalAlign:'middle', marginRight:'3px', opacity:.9 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{good.views}
          </span>

          {/* Wishlist */}
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 2 }}>
            <WishlistButton productId={good.id} size={32} />
          </div>

          {/* Out of stock */}
          {good.inStock === false && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', borderRadius: '14px 14px 0 0',
            }}>
              <span style={{
                background: '#dc2626', color: '#fff',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px',
                padding: '7px 18px', borderRadius: '6px',
              }}>Out of Stock</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 700, fontSize: '14px', lineHeight: 1.4, color: '#1A1A1A',
            marginBottom: '10px', overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {good.name}
          </h3>

          {/* Seller row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <div style={{ position: 'relative', width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '1.5px solid #E8E5E0' }}>
              <Image
                src={sellerImgSrc}
                alt={good.seller}
                width={22}
                height={22}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                onError={() => setSellerImgSrc('/placeholder-user.jpg')}
              />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B6660', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {good.seller}
            </span>
            {good.sellerVerified && <VerifiedBadge />}
            <span style={{ fontSize: '11px', color: good.sellerRating > 0 ? '#f59e0b' : '#ccc', flexShrink: 0 }}>
              {good.sellerRating > 0
                ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" style={{display:'inline',verticalAlign:'middle',marginRight:'2px'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{good.sellerRating.toFixed(1)}</>
                : '★ New'}
            </span>
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ height: '1px', background: '#F3F2EF', margin: '0 0 12px' }} />

          {/* Price + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '20px', color: '#5d3fd3', lineHeight: 1 }}>
                GHS {good.price.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#9A9590', marginTop: '3px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{good.createdAt}</div>
            </div>
            <div style={{
              padding: '8px 14px', flexShrink: 0,
              background: user ? '#1A1A1A' : '#F3F2EF',
              color: user ? '#fff' : '#9A9590',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700, fontSize: '11px', letterSpacing: '0.3px',
              borderRadius: '6px',
              border: user ? '1.5px solid #1A1A1A' : '1.5px solid #E8E5E0',
              transition: 'all 0.2s',
            }}>
              {user ? 'Message →' : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Msg</>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
