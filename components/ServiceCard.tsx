"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import type { Service } from '@/lib/mockData'

const categoryAccent: Record<string, string> = {
  'Barbing':    '#5d3fd3',
  'Tutoring':   '#1B5E20',
  'Photography':'#ff3366',
  'Laundry':    '#0284c7',
  'Tech Repair':'#111',
  'Design':     '#d97706',
  'Other':      '#555',
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
  const accent = categoryAccent[service.category] || '#333'
  const [imgSrc, setImgSrc] = useState(service.image || '/placeholder.jpg')
  const [providerImgSrc, setProviderImgSrc] = useState(service.providerImage || '/placeholder-user.jpg')

  return (
    <Link href={`/services/${service.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <div className="sc-card">
        {/* Category accent bar */}
        <div style={{ height: '4px', background: accent, flexShrink: 0 }} />

        {/* Image */}
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: '#f0f0f0', flexShrink: 0 }}>
          <Image
            src={imgSrc}
            alt={service.name}
            fill
            className="sc-img"
            style={{ objectFit: 'cover', transition: 'transform 0.45s ease' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgSrc('/placeholder.jpg')}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))', pointerEvents: 'none' }} />

          {/* Hover CTA overlay */}
          <div className="sc-cta-wrap" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span className="sc-cta" style={{
              fontFamily: '"Archivo Black", sans-serif', fontSize: '12px',
              color: '#fff', background: accent, padding: '10px 20px',
              opacity: 0, transform: 'translateY(8px)', transition: 'opacity 0.2s, transform 0.2s',
              letterSpacing: '1px',
            }}>
              BOOK NOW →
            </span>
          </div>

          {/* Category badge */}
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            background: accent, color: '#fff',
            fontSize: '9px', fontWeight: 800, padding: '4px 9px',
            letterSpacing: '0.8px', fontFamily: '"Space Grotesk", sans-serif',
          }}>
            {service.category.toUpperCase()}
          </span>

          {/* Bookings */}
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            fontSize: '10px', fontWeight: 600, padding: '3px 8px',
            fontFamily: '"Space Grotesk", sans-serif',
          }}>
            ✅ {service.bookings}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            fontWeight: 700, fontSize: '15px', lineHeight: 1.35, color: '#111',
            marginBottom: '10px', overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {service.name}
          </h3>

          {/* Provider row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <div style={{ position: 'relative', width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '1.5px solid #eee' }}>
              <Image
                src={providerImgSrc}
                alt={service.provider}
                width={22}
                height={22}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                onError={() => setProviderImgSrc('/placeholder-user.jpg')}
              />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {service.provider}
            </span>
            {service.providerVerified && <VerifiedBadge />}
            <span style={{ fontSize: '11px', color: service.providerRating > 0 ? '#f59e0b' : '#ccc', flexShrink: 0 }}>
              {service.providerRating > 0 ? `⭐${service.providerRating.toFixed(1)}` : '★ New'}
            </span>
          </div>

          {/* Availability pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#555', fontWeight: 500 }}>{service.availability}</span>
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ height: '1px', background: '#f0f0f0', margin: '0 0 12px' }} />

          {/* Rate + Book */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', color: accent, lineHeight: 1 }}>
                {service.rate}
              </div>
              <div style={{ fontSize: '10px', color: '#bbb', marginTop: '3px' }}>⏱ {service.responseTime}</div>
            </div>
            <div style={{
              padding: '8px 16px', flexShrink: 0,
              background: user ? accent : '#f5f5f5',
              color: user ? '#fff' : '#999',
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px',
              border: user ? `2px solid ${accent}` : '1px solid #ddd',
            }}>
              {user ? 'BOOK →' : '🔒 BOOK'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
