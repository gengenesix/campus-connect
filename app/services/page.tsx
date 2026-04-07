"use client"

import { useState, useEffect } from "react"
import ServiceCard from "@/components/ServiceCard"
import { supabase } from "@/lib/supabase"

interface Service {
  id: string
  name: string
  category: string
  rate: string | null
  availability: string | null
  image_url: string | null
  description: string
  response_time: string | null
  total_bookings: number
  provider: {
    name: string
    avatar_url: string | null
    rating: number
  } | null
}

const CATEGORIES = ['Barbing', 'Tutoring', 'Photography', 'Laundry', 'Tech Repair', 'Design', 'Other'] as const

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('services')
        .select(`
          id, name, category, rate, availability, image_url, description, response_time, total_bookings,
          provider:profiles!provider_id (name, avatar_url, rating)
        `)
        .neq('status', 'deleted')
        .order('total_bookings', { ascending: false })
      setServices((data as Service[]) ?? [])
      setLoading(false)
    }
    fetchServices()
  }, [])

  const filtered = services.filter(s => {
    if (category && s.category !== category) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !(s.provider?.name ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  if (loading) {
    return (
      <div>
        <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
          <div className="container">
            <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', letterSpacing: '-1px' }}>CAMPUS SERVICES</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', background: '#1B5E20', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
          <span style={{ color: '#888', fontWeight: 600 }}>Loading services...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', marginBottom: '6px', letterSpacing: '-1px' }}>
            CAMPUS SERVICES
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            {services.length} service{services.length !== 1 ? 's' : ''} from UMaT students · Book directly on campus
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ background: '#f8f8f8', borderBottom: '2px solid #111', padding: '16px 20px', overflowX: 'auto' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              style={{
                padding: '8px 20px', whiteSpace: 'nowrap',
                border: '2px solid #111',
                fontFamily: '"Archivo Black", sans-serif', fontSize: '12px',
                cursor: 'pointer', letterSpacing: '0.5px',
                background: (cat === 'All' && !category) || category === cat ? '#1B5E20' : '#fff',
                color: (cat === 'All' && !category) || category === cat ? '#fff' : '#111',
                transition: 'all 0.15s',
              }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px' }}>
        <div className="container">
          <input
            type="text"
            placeholder="Search services or providers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', maxWidth: '480px', padding: '10px 16px',
              border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif',
              fontSize: '14px', fontWeight: 600, outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Results */}
      <div className="container" style={{ paddingTop: '28px', paddingBottom: '60px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '28px', marginBottom: '10px' }}>
              {services.length === 0 ? 'NO SERVICES YET' : 'NO SERVICES FOUND'}
            </div>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              {services.length === 0 ? 'Be the first to offer a service!' : 'Try a different category or search term'}
            </p>
            {services.length === 0 ? (
              <a href="/offer-service" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '14px 32px' }}>
                OFFER A SERVICE →
              </a>
            ) : (
              <button onClick={() => { setCategory(''); setSearch('') }} className="btn-primary" style={{ cursor: 'pointer' }}>
                CLEAR FILTERS
              </button>
            )}
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '20px', fontWeight: 600, color: '#888', fontSize: '14px' }}>
              Showing <strong style={{ color: '#111' }}>{filtered.length}</strong> service{filtered.length !== 1 ? 's' : ''}
              {category && ` in ${category}`}
            </p>
            <div className="product-grid">
              {filtered.map(service => (
                <ServiceCard key={service.id} service={{
                  id: service.id,
                  name: service.name,
                  provider: service.provider?.name ?? 'UMaT Student',
                  providerImage: service.provider?.avatar_url ?? '/placeholder-user.jpg',
                  providerRating: service.provider?.rating ?? 5.0,
                  category: service.category as any,
                  rate: service.rate ?? 'Contact for pricing',
                  description: service.description ?? '',
                  availability: service.availability ?? 'Contact provider',
                  image: service.image_url ?? '/placeholder.jpg',
                  responseTime: service.response_time ?? 'Varies',
                  bookings: service.total_bookings,
                }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Offer CTA */}
      <div style={{ background: '#1B5E20', padding: '48px 20px', textAlign: 'center', color: '#fff' }}>
        <div className="container">
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '28px', marginBottom: '12px' }}>
            OFFER YOUR SERVICES
          </div>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px' }}>
            Are you a UMaT student with skills to offer? List your service and start earning on campus.
          </p>
          <a
            href="/offer-service"
            style={{
              display: 'inline-block', padding: '16px 40px',
              background: '#fff', color: '#1B5E20',
              fontFamily: '"Archivo Black", sans-serif', fontSize: '15px',
              textDecoration: 'none', border: '2px solid #fff',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
            }}
          >
            + LIST YOUR SERVICE
          </a>
        </div>
      </div>
    </div>
  )
}
