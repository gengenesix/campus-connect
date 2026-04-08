"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { Service } from '@/lib/mockData'

interface ServiceCardProps {
  service: Service
}

const categoryColors: Record<string, string> = {
  'Barbing':    '#5d3fd3',
  'Tutoring':   '#1B5E20',
  'Photography':'#ff3366',
  'Laundry':    '#0284c7',
  'Tech Repair':'#111',
  'Design':     '#d97706',
  'Other':      '#666',
}

function VerifiedBadge() {
  return (
    <span
      title="Verified by Campus Connect"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '15px', height: '15px',
        background: '#1d9bf0', borderRadius: '50%',
        fontSize: '9px', color: '#fff', fontWeight: 900, flexShrink: 0,
      }}
    >✓</span>
  )
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const router = useRouter()
  const { user } = useAuth()

  const handleBook = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (user) {
      router.push('/messages')
    } else {
      router.push('/auth/login?redirect=/messages')
    }
  }

  return (
    <Link href={`/services/${service.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          border: '2px solid #eee', background: '#fff',
          overflow: 'hidden', transition: 'all 0.2s',
          cursor: 'pointer', height: '100%',
          display: 'flex', flexDirection: 'column',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = '#111'
          el.style.boxShadow = '4px 4px 0 #111'
          el.style.transform = 'translate(-2px, -2px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = '#eee'
          el.style.boxShadow = 'none'
          el.style.transform = 'none'
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: '#f0f0f0', flexShrink: 0 }}>
          <img
            src={service.image}
            alt={service.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.currentTarget.src = '/placeholder.jpg' }}
            loading="lazy"
          />
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            background: categoryColors[service.category] || '#111',
            color: '#fff', fontSize: '10px', fontWeight: 700,
            padding: '4px 10px', letterSpacing: '0.5px',
          }}>
            {service.category.toUpperCase()}
          </span>
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '10px',
            fontWeight: 700, padding: '4px 10px',
          }}>
            ✅ {service.bookings}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px', lineHeight: 1.3, color: '#111' }}>
            {service.name}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <img
              src={service.providerImage}
              alt={service.provider}
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }}
              onError={(e) => { e.currentTarget.src = '/placeholder-user.jpg' }}
              loading="lazy"
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>{service.provider}</span>
            {service.providerVerified && <VerifiedBadge />}
            <span style={{ fontSize: '11px', color: service.providerRating > 0 ? '#f59e0b' : '#aaa', marginLeft: 'auto' }}>
              {service.providerRating > 0 ? `⭐ ${service.providerRating}/5` : '★ New'}
            </span>
          </div>

          <p style={{
            fontSize: '12px', color: '#888', marginBottom: '12px', lineHeight: 1.5,
            flex: 1, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {service.description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '15px', color: '#1B5E20' }}>{service.rate}</div>
              <div style={{ fontSize: '11px', color: '#aaa' }}>⏱ {service.responseTime}</div>
            </div>
            <div
              onClick={handleBook}
              title={user ? 'Book this service' : 'Sign in to book'}
              style={{
                padding: '8px 14px',
                background: user ? '#1B5E20' : '#f0f0f0',
                color: user ? '#fff' : '#888',
                fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px',
                cursor: 'pointer',
                border: user ? 'none' : '1px solid #ddd',
              }}
            >
              {user ? 'BOOK →' : '🔒 BOOK'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
