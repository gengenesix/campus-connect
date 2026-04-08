"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface Service {
  id: string
  name: string
  category: string
  rate: string | null
  availability: string | null
  response_time: string | null
  image_url: string | null
  description: string
  total_bookings: number
  whatsapp: string | null
  provider: {
    id: string
    name: string
    avatar_url: string | null
    rating: number
    phone: string | null
  } | null
}

interface RelatedService {
  id: string
  name: string
  rate: string | null
  image_url: string | null
}

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [related, setRelated] = useState<RelatedService[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('services')
        .select(`
          id, name, category, rate, availability, response_time, image_url, description, total_bookings, whatsapp,
          provider:profiles!provider_id (id, name, avatar_url, rating, phone)
        `)
        .eq('id', params.id)
        .neq('status', 'deleted')
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const s = data as Service
      setService(s)

      const { data: relatedData } = await supabase
        .from('services')
        .select('id, name, rate, image_url')
        .eq('category', s.category)
        .neq('id', params.id)
        .neq('status', 'deleted')
        .limit(3)

      setRelated((relatedData as RelatedService[]) ?? [])
      setLoading(false)
    }

    if (params.id) fetchService()
  }, [params.id])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (notFound || !service) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px' }}>NOT FOUND</div>
        <p style={{ color: '#888' }}>This service may have been removed or paused.</p>
        <Link href="/services" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px' }}>← BACK TO SERVICES</Link>
      </div>
    )
  }

  const contact = service.whatsapp || service.provider?.phone
  const whatsappMsg = `Hi ${service.provider?.name ?? ''}, I'd like to book: ${service.name} on Campus Connect`
  const whatsappHref = contact
    ? `https://wa.me/${contact.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`

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
                src={service.image_url ?? '/placeholder.jpg'}
                alt={service.name}
                style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.currentTarget.src = '/placeholder.jpg' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 14px', background: '#1B5E20', color: '#fff', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #111' }}>
                {service.category.toUpperCase()}
              </span>
              {service.response_time && (
                <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #ddd', color: '#888' }}>
                  ⏱ {service.response_time}
                </span>
              )}
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #ddd', color: '#888' }}>
                ✅ {service.total_bookings} bookings
              </span>
            </div>

            {service.availability && (
              <div style={{ marginTop: '20px', border: '2px solid #1B5E20', padding: '16px', background: '#e8f5e9' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#1B5E20', marginBottom: '6px' }}>AVAILABILITY</div>
                <div style={{ fontWeight: 700, color: '#1B5E20', fontSize: '15px' }}>📅 {service.availability}</div>
              </div>
            )}
          </div>

          {/* RIGHT — Info */}
          <div>
            <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '30px', lineHeight: 1.1, marginBottom: '16px', color: '#111', letterSpacing: '-0.5px' }}>
              {service.name}
            </h1>

            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '40px', color: '#1B5E20', marginBottom: '6px', lineHeight: 1 }}>
              {service.rate ?? 'Contact for pricing'}
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Pricing may vary by request</div>

            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#444', marginBottom: '28px', paddingLeft: '16px', borderLeft: '4px solid #1B5E20' }}>
              {service.description}
            </p>

            {/* Provider Card */}
            <div style={{ border: '2px solid #111', padding: '20px', background: '#fff', marginBottom: '20px', boxShadow: '4px 4px 0 #111' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '12px', color: '#888' }}>SERVICE PROVIDER</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {service.provider?.avatar_url ? (
                  <img
                    src={service.provider.avatar_url}
                    alt={service.provider.name}
                    style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #111', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = '/placeholder-user.jpg' }}
                  />
                ) : (
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', border: '2px solid #111' }}>
                    {(service.provider?.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>{service.provider?.name ?? 'UMaT Provider'}</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>⭐ {service.provider?.rating?.toFixed(1) ?? '5.0'}/5 · UMaT Provider</div>
                </div>
              </div>
            </div>

            {/* Book */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {user ? (
                <a
                  href={whatsappHref}
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
              ) : (
                <Link
                  href={`/auth/login?redirect=/services/${service.id}`}
                  style={{
                    textAlign: 'center', display: 'block', textDecoration: 'none',
                    padding: '18px 40px', background: '#888', color: '#fff',
                    fontFamily: '"Archivo Black", sans-serif', fontSize: '16px',
                    border: '2px solid #111', boxShadow: '4px 4px 0 #111',
                  }}
                >
                  🔒 LOGIN TO BOOK
                </Link>
              )}
              <Link
                href="/services"
                className="btn-secondary hover-lift"
                style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '16px 40px' }}
              >
                ← BACK TO SERVICES
              </Link>
            </div>

            <div style={{ padding: '14px 16px', background: '#e8f5e9', border: '2px solid #1B5E20', fontSize: '13px', color: '#1B5E20', lineHeight: 1.5 }}>
              ✅ <strong>Active provider:</strong> {service.response_time ? `Response time is ${service.response_time}.` : ''} This provider is verified on campus.
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
                    <img src={s.image_url ?? '/placeholder.jpg'} alt={s.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} onError={(e) => { e.currentTarget.src = '/placeholder.jpg' }} />
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{s.name}</div>
                      <div style={{ fontFamily: '"Archivo Black"', fontSize: '16px', color: '#1B5E20' }}>{s.rate ?? 'Contact for pricing'}</div>
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
