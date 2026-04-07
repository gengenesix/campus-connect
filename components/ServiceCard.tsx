"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function ServiceCard({ service }: ServiceCardProps) {
  const router = useRouter()
  return (
    <Link href={`/services/${service.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          border: '2px solid #eee',
          background: '#fff',
          overflow: 'hidden',
          transition: 'all 0.2s',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <img
              src={service.providerImage}
              alt={service.provider}
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }}
              onError={(e) => { e.currentTarget.src = '/placeholder-user.jpg' }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>{service.provider}</span>
            <span style={{ fontSize: '11px', color: '#f59e0b', marginLeft: 'auto' }}>⭐ {service.providerRating}</span>
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
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push('/messages') }}
              style={{ padding: '8px 14px', background: '#1B5E20', color: '#fff', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', cursor: 'pointer' }}
            >
              BOOK →
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
