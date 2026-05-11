"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ServiceCard from '@/components/ServiceCard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

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
  provider: { name: string; avatar_url: string | null; rating: number; is_verified: boolean } | null
}

const CATEGORIES = ['Barbing', 'Tutoring', 'Photography', 'Laundry', 'Tech Repair', 'Design', 'Other'] as const
const PAGE_SIZE = 20

export default function ServicesPageClient({
  initialServices,
  sp,
}: {
  initialServices: Service[]
  sp: { q: string; category: string; university_id: string }
}) {
  const router = useRouter()
  const { profile } = useAuth()
  const [search, setSearch] = useState(sp.q)
  const [category, setCategory] = useState(sp.category)
  const [campusOnly, setCampusOnly] = useState(!!sp.university_id)
  const [services, setServices] = useState(initialServices)
  const [hasMore, setHasMore] = useState(initialServices.length === PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const offsetRef = useRef(initialServices.length)
  const isFirstRender = useRef(true)

  const userUniversityId = profile?.university_id ?? ''

  // Sync services list when server provides new initial data
  useEffect(() => {
    setServices(initialServices)
    offsetRef.current = initialServices.length
    setHasMore(initialServices.length === PAGE_SIZE)
  }, [initialServices])

  // Push URL update when filters change (skip initial mount)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    const delay = search !== sp.q ? 350 : 0
    const t = setTimeout(() => {
      const p = new URLSearchParams()
      if (search) p.set('q', search)
      if (category) p.set('category', category)
      if (campusOnly && userUniversityId) p.set('university_id', userUniversityId)
      router.replace(`/services${p.size ? '?' + p.toString() : ''}`, { scroll: false })
    }, delay)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, campusOnly])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      if (search.trim()) {
        const page = Math.floor(offsetRef.current / PAGE_SIZE) + 2
        const p = new URLSearchParams({ q: search, type: 'services', page: String(page) })
        if (category) p.set('category', category)
        if (campusOnly && userUniversityId) p.set('university_id', userUniversityId)
        const res = await fetch(`/api/search?${p}`)
        const json = await res.json()
        const rows: Service[] = json.hits ?? []
        setServices(prev => [...prev, ...rows])
        offsetRef.current += rows.length
        setHasMore(json.hasMore)
      } else {
        const from = offsetRef.current + PAGE_SIZE
        let q = supabase
          .from('services')
          .select(`
            id, provider_id, name, category, rate, availability, image_url, description, response_time, total_bookings,
            provider:profiles!provider_id (name, avatar_url, rating, is_verified)
          `)
          .neq('status', 'deleted')
        if (category) q = q.eq('category', category)
        if (campusOnly && userUniversityId) q = q.eq('university_id', userUniversityId)
        const { data } = await q.order('total_bookings', { ascending: false }).range(from, from + PAGE_SIZE - 1)
        const rows = (data as unknown as Service[]) ?? []
        setServices(prev => [...prev, ...rows])
        offsetRef.current = from
        setHasMore(rows.length === PAGE_SIZE)
      }
    } catch {}
    finally { setLoadingMore(false) }
  }

  const hasFilters = category || search || campusOnly
  const clearFilters = () => { setCategory(''); setSearch(''); setCampusOnly(false) }

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', marginBottom: '6px', letterSpacing: '-1px' }}>
            CAMPUS SERVICES
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            {services.length} service{services.length !== 1 ? 's' : ''} from campus students · Book directly on campus
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ background: '#f8f8f8', borderBottom: '2px solid #111', padding: '16px 20px', overflowX: 'auto' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
          {(['All', ...CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              style={{
                padding: '8px 20px', whiteSpace: 'nowrap', border: '2px solid #111',
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

      {/* Search + Campus Filter */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px' }}>
        <div className="container" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search services or providers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px', maxWidth: '480px', padding: '10px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', fontWeight: 600, outline: 'none' }}
          />
          {userUniversityId && (
            <button
              onClick={() => setCampusOnly(v => !v)}
              style={{
                padding: '10px 16px', border: '2px solid #111', cursor: 'pointer',
                fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', letterSpacing: '0.5px',
                background: campusOnly ? '#1B5E20' : '#fff',
                color: campusOnly ? '#fff' : '#111',
                boxShadow: campusOnly ? '2px 2px 0 #111' : 'none',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {campusOnly ? '● MY CAMPUS' : '○ MY CAMPUS'}
            </button>
          )}
          {hasFilters && (
            <button onClick={clearFilters} style={{ padding: '10px 18px', background: '#ff3366', color: '#fff', border: '2px solid #111', fontWeight: 700, cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontSize: '13px' }}>
              ✕ CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container" style={{ paddingTop: '28px', paddingBottom: '60px' }}>
        {services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{campusOnly ? '🏫' : '🔍'}</div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '28px', marginBottom: '10px' }}>
              {campusOnly ? 'NO CAMPUS SERVICES YET' : hasFilters ? 'NO SERVICES FOUND' : 'NO SERVICES YET'}
            </div>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              {campusOnly
                ? 'No services listed at your campus yet. Be the first!'
                : hasFilters ? 'Try a different category or search term' : 'Be the first to offer a service!'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {campusOnly && (
                <button
                  onClick={() => setCampusOnly(false)}
                  style={{ padding: '12px 24px', background: '#fff', color: '#111', border: '2px solid #111', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', cursor: 'pointer', boxShadow: '3px 3px 0 #111' }}
                >
                  ALL UNIVERSITIES
                </button>
              )}
              {hasFilters && !campusOnly ? (
                <button onClick={clearFilters} className="btn-primary" style={{ cursor: 'pointer' }}>CLEAR FILTERS</button>
              ) : (
                <a href="/offer-service" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '14px 32px' }}>
                  OFFER A SERVICE →
                </a>
              )}
            </div>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '20px', fontWeight: 600, color: '#888', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Showing <strong style={{ color: '#111' }}>{services.length}</strong> service{services.length !== 1 ? 's' : ''}
              {category && ` in ${category}`}
              {campusOnly && (
                <span style={{ padding: '2px 8px', background: '#1B5E20', color: '#fff', fontSize: '11px', fontFamily: '"Archivo Black", sans-serif', letterSpacing: '0.5px' }}>
                  MY CAMPUS
                </span>
              )}
            </p>
            <div className="product-grid">
              {services.map(service => (
                <ServiceCard key={service.id} service={{
                  id: service.id,
                  name: service.name,
                  provider: service.provider?.name ?? 'Provider',
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
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    padding: '14px 48px',
                    background: loadingMore ? '#888' : '#1B5E20',
                    color: '#fff',
                    fontFamily: '"Archivo Black", sans-serif',
                    fontSize: '14px',
                    border: '2px solid #111',
                    boxShadow: loadingMore ? 'none' : '4px 4px 0 #111',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.5px',
                    transition: 'all 0.15s',
                  }}
                >
                  {loadingMore ? 'LOADING...' : 'LOAD MORE'}
                </button>
              </div>
            )}
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
            Got skills? List your service and start earning on campus.
          </p>
          <a
            href="/offer-service"
            style={{ display: 'inline-block', padding: '16px 40px', background: '#fff', color: '#1B5E20', fontFamily: '"Archivo Black", sans-serif', fontSize: '15px', textDecoration: 'none', border: '2px solid #fff', boxShadow: '4px 4px 0 rgba(0,0,0,0.3)' }}
          >
            + LIST YOUR SERVICE
          </a>
        </div>
      </div>
    </div>
  )
}
