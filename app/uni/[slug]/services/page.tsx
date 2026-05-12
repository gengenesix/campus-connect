"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ServiceCard from '@/components/ServiceCard'
import { supabase } from '@/lib/supabase'
import { getUniversityBySlug } from '@/lib/ghana-universities'
import { notFound } from 'next/navigation'
import SectionWrapper from '@/components/ui/SectionWrapper'

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
const PAGE_SIZE = 20

export default function UniServicesPage() {
  const params = useParams<{ slug: string }>()
  const uni = getUniversityBySlug(params.slug)

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const offsetRef = useRef(0)
  const [uniId, setUniId] = useState<string | null>(null)
  const [allUnis, setAllUnis] = useState(false)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    if (!params.slug) return
    supabase
      .from('universities')
      .select('id')
      .eq('slug', params.slug)
      .single()
      .then(({ data }) => setUniId(data?.id ?? null))
  }, [params.slug])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const buildQuery = useCallback((from: number) => {
    let query = supabase
      .from('services')
      .select(`
        id, provider_id, name, category, rate, availability, image_url, description, response_time, total_bookings,
        provider:profiles!provider_id (name, avatar_url, rating, is_verified)
      `)
      .eq('status', 'active')

    if (!allUnis && uniId) query = query.eq('university_id', uniId)

    if (debouncedSearch.trim()) {
      query = query.textSearch('search_vector', debouncedSearch.trim(), { type: 'websearch', config: 'english' })
    }
    if (category) query = query.eq('category', category)

    return query.order('total_bookings', { ascending: false }).range(from, from + PAGE_SIZE - 1)
  }, [uniId, debouncedSearch, category, allUnis])

  const fetchServices = useCallback(async () => {
    if (!allUnis && uniId === null) return
    setLoading(true)
    offsetRef.current = 0
    try {
      const { data } = await buildQuery(0)
      const rows = (data as unknown as Service[]) ?? []
      setServices(rows)
      setHasMore(rows.length === PAGE_SIZE)
    } catch {
      setServices([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [buildQuery, uniId, allUnis])

  const loadMore = async () => {
    setLoadingMore(true)
    const newOffset = offsetRef.current + PAGE_SIZE
    try {
      const { data } = await buildQuery(newOffset)
      const rows = (data as unknown as Service[]) ?? []
      setServices(prev => [...prev, ...rows])
      offsetRef.current = newOffset
      setHasMore(rows.length === PAGE_SIZE)
    } catch {
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => { fetchServices() }, [fetchServices])

  if (!uni) return notFound()

  const hasFilters = category || search

  return (
    <>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ fontSize: '12px', color: '#888', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '6px' }}>
            <Link href={`/uni/${uni.slug}`} style={{ color: '#888', textDecoration: 'none' }}>
              {uni.shortName}
            </Link> · SERVICES
          </div>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '44px', letterSpacing: '-1px', marginBottom: '4px' }}>
            {uni.shortName} SERVICES
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {loading ? 'Loading...' : `${services.length}${hasMore ? '+' : ''} services${allUnis ? ' · all Ghana universities' : ` by ${uni.shortName} students`}`}
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ background: '#f8f8f8', borderBottom: '2px solid #111', padding: '16px 20px', overflowX: 'auto' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }}>
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              style={{
                padding: '8px 20px', whiteSpace: 'nowrap', border: '2px solid #111',
                fontFamily: '"Syne", sans-serif', fontSize: '12px',
                cursor: 'pointer', letterSpacing: '0.5px',
                background: (cat === 'All' && !category) || category === cat ? '#1B5E20' : '#fff',
                color: (cat === 'All' && !category) || category === cat ? '#fff' : '#111',
              }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <button
              onClick={() => setAllUnis(v => !v)}
              style={{
                padding: '8px 16px', border: '2px solid #111',
                fontFamily: '"Syne", sans-serif', fontSize: '11px',
                cursor: 'pointer', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                background: allUnis ? '#5d3fd3' : '#fff',
                color: allUnis ? '#fff' : '#111',
                boxShadow: allUnis ? '3px 3px 0 #111' : 'none',
              }}
            >
              {allUnis ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{display:'inline',verticalAlign:'middle',marginRight:'5px'}}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>ALL UNIS</>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{display:'inline',verticalAlign:'middle',marginRight:'5px'}}><rect x="3" y="9" width="18" height="12"/><path d="M3 9l9-6 9 6"/><path d="M9 21V12h6v9"/></svg>THIS UNI</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px' }}>
        <div className="container" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, maxWidth: '480px', padding: '10px 16px', border: '2px solid #111', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', fontWeight: 600, outline: 'none' }}
          />
          {hasFilters && (
            <button onClick={() => { setCategory(''); setSearch(''); setDebouncedSearch('') }} style={{ padding: '10px 18px', background: '#ff3366', color: '#fff', border: '2px solid #111', fontWeight: 700, cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px' }}>
              ✕ CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <SectionWrapper className="bg-[#f8f8f8]">
        {loading ? (
          <div className="product-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ border: '2px solid #eee', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: '4px' }} />
                <div className="skeleton" style={{ height: '200px' }} />
                <div style={{ padding: '14px' }}>
                  <div className="skeleton" style={{ height: '16px', marginBottom: '10px', width: '85%' }} />
                  <div className="skeleton" style={{ height: '12px', width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: '#ccc' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', marginBottom: '10px' }}>
              {hasFilters ? 'NO SERVICES FOUND' : allUnis ? 'NO SERVICES YET' : `NO SERVICES AT ${uni.shortName.toUpperCase()} YET`}
            </div>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              {hasFilters ? 'Try a different filter.' : 'Be the first to offer a service!'}
            </p>
            <Link href={`/offer-service?uni=${uni.slug}`} className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '14px 32px' }}>
              + OFFER A SERVICE →
            </Link>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '20px', fontWeight: 600, color: '#888', fontSize: '14px' }}>
              Showing <strong style={{ color: '#111' }}>{services.length}</strong> service{services.length !== 1 ? 's' : ''}
              {category && ` in ${category}`}
              {allUnis && <span style={{ color: '#5d3fd3', fontWeight: 700 }}> · all universities</span>}
            </p>
            <div className="product-grid">
              {services.map(s => (
                <ServiceCard key={s.id} service={{
                  id: s.id, name: s.name,
                  provider: s.provider?.name ?? 'Student',
                  providerId: s.provider_id,
                  providerImage: s.provider?.avatar_url ?? '/placeholder-user.jpg',
                  providerRating: s.provider?.rating ?? 0,
                  providerVerified: s.provider?.is_verified ?? false,
                  category: s.category as any,
                  rate: s.rate ?? 'Contact for pricing',
                  description: s.description ?? '',
                  availability: s.availability ?? 'Contact provider',
                  image: s.image_url ?? '/placeholder.jpg',
                  responseTime: s.response_time ?? 'Varies',
                  bookings: s.total_bookings,
                }} />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{ padding: '14px 48px', background: loadingMore ? '#888' : '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '14px', border: '2px solid #111', boxShadow: loadingMore ? 'none' : '4px 4px 0 #111', cursor: loadingMore ? 'not-allowed' : 'pointer' }}
                >
                  {loadingMore ? 'LOADING...' : 'LOAD MORE'}
                </button>
              </div>
            )}
          </>
        )}
      </SectionWrapper>
    </>
  )
}
