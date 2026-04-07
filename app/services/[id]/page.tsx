"use client"

import Link from 'next/link'
import { mockServices } from '@/lib/mockData'
import { notFound, useParams } from 'next/navigation'

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>()
  const service = mockServices.find(s => s.id === params.id)
  if (!service) notFound()

  const related = mockServices.filter(s => s.id !== service.id && s.category === service.category).slice(0, 3)

  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#111', padding: '12px 20px' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#666' }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/services" style={{ color: '#666', textDecoration: 'none' }}>Services</Link>
          <span>›</span>
          <span style={{ color: '#86efac' }}>{service.name}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '48px', alignItems: 'start' }}>

          {/* LEFT — Image + Stats */}
          <div>
            <div style={{ border: '3px solid #111', overflow: 'hidden', background: '#fff', boxShadow: '8px 8px 0 #1B5E20' }}>
              <img
                src={service.image}
                alt={service.name}
                style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.currentTarget.src = '/placeholder.jpg' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 14px', background: '#1B5E20', color: '#fff', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #111' }}>
                {service.category.toUpperCase()}
              </span>
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #ddd', color: '#888' }}>
                ⏱ {service.responseTime}
              </span>
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #ddd', color: '#888' }}>
                ✅ {service.bookings} bookings
              </span>
            </div>

            {/* Availability Card */}
            <div style={{ marginTop: '20px', border: '2px solid #1B5E20', padding: '16px', background: '#e8f5e9' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#1B5E20', marginBottom: '6px' }}>AVAILABILITY</div>
              <div style={{ fontWeight: 700, color: '#1B5E20', fontSize: '15px' }}>📅 {service.availability}</div>
            </div>
          </div>

          {/* RIGHT — Info */}
          <div>
            <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '30px', lineHeight: 1.1, marginBottom: '16px', color: '#111', letterSpacing: '-0.5px' }}>
              {service.name}
            </h1>

            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '40px', color: '#1B5E20', marginBottom: '6px', lineHeight: 1 }}>
              {service.rate}
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Pricing may vary by request</div>

            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#444', marginBottom: '28px', paddingLeft: '16px', borderLeft: '4px solid #1B5E20' }}>
              {service.description}
            </p>

            {/* Provider Card */}
            <div style={{ border: '2px solid #111', padding: '20px', background: '#fff', marginBottom: '20px', boxShadow: '4px 4px 0 #111' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '12px', color: '#888' }}>SERVICE PROVIDER</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={service.providerImage}
                  alt={service.provider}
                  style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #111', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.src = '/placeholder-user.jpg' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>{service.provider}</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>⭐ {service.providerRating}/5 · UMaT Provider</div>
                </div>
              </div>
            </div>

            {/* Book */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <a
                href={`https://wa.me/?text=Hi%20${encodeURIComponent(service.provider)}%2C%20I%27d%20like%20to%20book%3A%20${encodeURIComponent(service.name)}%20on%20Campus%20Connect`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textAlign: 'center', display: 'block', textDecoration: 'none',
                  padding: '18px 40px', background: '#1B5E20', color: '#fff',
                  fontFamily: '"Archivo Black", sans-serif', fontSize: '16px',
                  border: '2px solid #111', boxShadow: '4px 4px 0 #111',
                  transition: 'all 0.2s',
                }}
              >
                📅 BOOK NOW
              </a>
              <Link
                href="/services"
                className="btn-secondary hover-lift"
                style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '16px 40px' }}
              >
                ← BACK TO SERVICES
              </Link>
            </div>

            <div style={{ padding: '14px 16px', background: '#e8f5e9', border: '2px solid #1B5E20', fontSize: '13px', color: '#1B5E20', lineHeight: 1.5 }}>
              ✅ <strong>Active provider:</strong> Response time is {service.responseTime}. This provider is verified on campus.
            </div>
          </div>
        </div>

        {/* Related Services */}
        {related.length > 0 && (
          <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid #111' }}>
            <div className="trending-header" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '22px', textTransform: 'uppercase' }}>
                More {service.category} Services
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {related.map(s => (
                <Link key={s.id} href={`/services/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ border: '2px solid #eee', background: '#fff', overflow: 'hidden', transition: '0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#111'; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #1B5E20' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#eee'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <img src={s.image} alt={s.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} onError={(e) => { e.currentTarget.src = '/placeholder.jpg' }} />
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{s.name}</div>
                      <div style={{ fontFamily: '"Archivo Black"', fontSize: '16px', color: '#1B5E20' }}>{s.rate}</div>
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
