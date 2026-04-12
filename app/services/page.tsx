"use client"

import { useState, useEffect, useCallback } from "react"
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
  provider_id: string
  provider: {
    name: string
    avatar_url: string | null
    rating: number
    is_verified: boolean
  } | null
}

const CATEGORIES = ['Barbing', 'Tutoring', 'Photography', 'Laundry', 'Tech Repair', 'Design', 'Other'] as const

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce text input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Server-side filtered fetch
  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('services')
        .select(`
          id, provider_id, name, category, rate, availability, image_url, description, response_time, total_bookings,
          provider:profiles!provider_id (name, avatar_url, rating, is_verified)
        `)
        .neq('status', 'deleted')

      // Full-text search via GIN index on services.search_vector
      if (debouncedSearch.trim()) {
        query = query.textSearch('search_vector', debouncedSearch.trim(), {
          type: 'websearch',
          config: 'english',
        })
      }

      if (category) query = query.eq('category', category)

      query = query.order('total_bookings', { ascending: false })

      const { data } = await query
      setServices((data as Service[]) ?? [])
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, category])

  useEffect(() => { fetchServices() }, [fetchServices])

  const hasFilters = category || search

  if (loading) {
    return (
      <div>
        <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
          <div className="container">
            <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', letterSpacing: '-1px' }}>CAMPUS SERVICES</h1>
          </div>
        </div>
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
          <div className="product-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ border: '2px solid #eee', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: '4px' }} />
                <div className="skeleton" style={{ height: '200px' }} />
                <div style={{ padding: '14px 16px 16px' }}>
                  <div className="skeleton" style={{ height: '16px', marginBottom: '10px', width: '85%' }} />
                  <div className="skeleton" style={{ height: '12px', marginBottom: '6px', width: '55%' }} />
                  <div className="skeleton" style={{ height: '12px', marginBottom: '20px', width: '40%' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ height: '22px', width: '40%' }} />
                    <div className="skeleton" style={{ height: '22px', width: '22%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
        <div className="container" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search services or providers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, maxWidth: '480px', padding: '10px 16px',
              border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif',
              fontSize: '14px', fontWeight: 600, outline: 'none',
            }}
          />
          {hasFilters && (
            <button
              onClick={() => { setCategory(''); setSearch(''); setDebouncedSearch('') }}
              style={{ padding: '10px 18px', background: '#ff3366', color: '#fff', border: '2px solid #111', fontWeight: 700, cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontSize: '13px' }}
            >
              ✕ CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container" style={{ paddingTop: '28px', paddingBottom: '60px' }}>
        {services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '28px', marginBottom: '10px' }}>
              {hasFilters ? 'NO SERVICES FOUND' : 'NO SERVICES YET'}
            </div>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              {hasFilters ? 'Try a different category or search term' : 'Be the first to offer a service!'}
            </p>
            {hasFilters ? (
              <button onClick={() => { setCategory(''); setSearch(''); setDebouncedSearch('') }} className="btn-primary" style={{ cursor: 'pointer' }}>
                CLEAR FILTERS
              </button>
            ) : (
              <a href="/offer-service" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '14px 32px' }}>
                OFFER A SERVICE →
              </a>
            )}
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '20px', fontWeight: 600, color: '#888', fontSize: '14px' }}>
              Showing <strong style={{ color: '#111' }}>{services.length}</strong> service{services.length !== 1 ? 's' : ''}
              {category && ` in ${category}`}
            </p>
            <div className="product-grid">
              {services.map(service => (
                <ServiceCard key={service.id} service={{
                  id: service.id,
                  name: service.name,
                  provider: service.provider?.name ?? 'UMaT Student',
                  providerId: service.provider_id,
                  providerImage: service.provider?.avatar_url ?? '/placeholder-user.jpg',
                  providerRating: service.provider?.rating ?? 0,
                  providerVerified: service.provider?.is_verified ?? false,
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
