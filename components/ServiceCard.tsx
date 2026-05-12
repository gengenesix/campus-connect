"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import type { Service } from '@/lib/supabase'
import WishlistButton from '@/components/WishlistButton'

const categoryMeta: Record<string, { bg: string; text: string; tint: string }> = {
  'Barbing':    { bg: '#5d3fd3', text: '#fff', tint: '#EDE9FE' },
  'Tutoring':   { bg: '#1B5E20', text: '#fff', tint: '#E8F5E9' },
  'Photography':{ bg: '#B45309', text: '#fff', tint: '#FEF3C7' },
  'Laundry':    { bg: '#0284c7', text: '#fff', tint: '#E0F2FE' },
  'Tech Repair':{ bg: '#1A1A1A', text: '#fff', tint: '#F3F2EF' },
  'Design':     { bg: '#C2410C', text: '#fff', tint: '#FEE2E2' },
  'Other':      { bg: '#6B6660', text: '#fff', tint: '#F3F2EF' },
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

export default function ServiceCard({ service }: { service: Service }) {
  const { user } = useAuth()
  const meta = categoryMeta[service.category] || categoryMeta['Other']
  const [imgSrc, setImgSrc] = useState(service.image || '/placeholder.jpg')
  const [providerImgSrc, setProviderImgSrc] = useState(service.providerImage || '/placeholder-user.jpg')

  return (
    <Link href={`/services/${service.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <div className="sc-card">
        {/* Category accent bar — thinner, subtler */}
        <div style={{ height: '3px', background: meta.bg, flexShrink: 0, borderRadius: '14px 14px 0 0' }} />

        {/* Image */}
        <div style={{ position: 'relative', height: '196px', overflow: 'hidden', background: '#F3F2EF', flexShrink: 0 }}>
          <Image
            src={imgSrc}
            alt={service.name}
            fill
            className="sc-img"
            style={{ objectFit: 'cover', transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)' }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgSrc('/placeholder.jpg')}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '64px', background: 'linear-gradient(transparent, rgba(0,0,0,0.38))', pointerEvents: 'none' }} />

          {/* Hover CTA */}
          <div className="sc-cta-wrap" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span className="sc-cta" style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '12px',
              color: '#fff', background: meta.bg, padding: '9px 18px',
              borderRadius: '6px', opacity: 0, transform: 'translateY(8px)',
              transition: 'opacity 0.2s, transform 0.2s', letterSpacing: '0.3px',
            }}>
              Book Now →
            </span>
          </div>

          {/* Wishlist */}
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 2 }}>
            <WishlistButton serviceId={service.id} size={32} />
          </div>

          {/* Category badge */}
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            background: meta.bg, color: meta.text,
            fontSize: '9px', fontWeight: 700, padding: '3px 8px',
            borderRadius: '999px', fontFamily: '"Plus Jakarta Sans", sans-serif',
            letterSpacing: '0.4px',
          }}>
            {service.category}
          </span>

          {/* Bookings count */}
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.5)', color: '#fff',
            fontSize: '10px', fontWeight: 600, padding: '3px 8px',
            borderRadius: '999px', fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}><polyline points="20 6 9 17 4 12"/></svg>{service.bookings}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 700, fontSize: '14px', lineHeight: 1.4, color: '#1A1A1A',
            marginBottom: '10px', overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {service.name}
          </h3>

          {/* Provider row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
            <div style={{ position: 'relative', width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '1.5px solid #E8E5E0' }}>
              <Image
                src={providerImgSrc}
                alt={service.provider}
                width={22}
                height={22}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                onError={() => setProviderImgSrc('/placeholder-user.jpg')}
              />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B6660', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {service.provider}
            </span>
            {service.providerVerified && <VerifiedBadge />}
            <span style={{ fontSize: '11px', color: service.providerRating > 0 ? '#f59e0b' : '#ccc', flexShrink: 0 }}>
              {service.providerRating > 0
                ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" style={{display:'inline',verticalAlign:'middle',marginRight:'2px'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{service.providerRating.toFixed(1)}</>
                : '★ New'}
            </span>
          </div>

          {/* Availability */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#6B6660', fontWeight: 500, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{service.availability}</span>
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ height: '1px', background: '#F3F2EF', margin: '0 0 12px' }} />

          {/* Rate + Book */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '15px', color: meta.bg, lineHeight: 1 }}>
                {service.rate}
              </div>
              <div style={{ fontSize: '10px', color: '#9A9590', marginTop: '3px', display:'flex', alignItems:'center', gap:'3px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {service.responseTime}
              </div>
            </div>
            <div style={{
              padding: '8px 14px', flexShrink: 0,
              background: user ? meta.bg : '#F3F2EF',
              color: user ? '#fff' : '#9A9590',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700, fontSize: '11px', letterSpacing: '0.3px',
              borderRadius: '6px',
              border: user ? `1.5px solid ${meta.bg}` : '1.5px solid #E8E5E0',
              transition: 'all 0.2s',
            }}>
              {user ? 'Book →' : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Book</>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
