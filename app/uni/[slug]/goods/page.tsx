"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import GoodsCard from '@/components/GoodsCard'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'
import { getUniversityBySlug } from '@/lib/ghana-universities'
import { notFound } from 'next/navigation'
import SectionWrapper from '@/components/ui/SectionWrapper'

interface Product {
  id: string
  seller_id: string
  title: string
  price: number
  condition: string
  category: string
  image_url: string | null
  views: number
  description: string
  created_at: string
  whatsapp: string | null
  in_stock: boolean
  seller: {
    name: string
    avatar_url: string | null
    rating: number
    is_verified: boolean
  } | null
}

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Furniture', 'Sports', 'Other'] as const
const PAGE_SIZE = 20

export default function UniGoodsPage() {
  const params = useParams<{ slug: string }>()
  const uni = getUniversityBySlug(params.slug)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const offsetRef = useRef(0)
  const [uniId, setUniId] = useState<string | null>(null)
  const [condition, setCondition] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [allUnis, setAllUnis] = useState(false)

  // Fetch university ID from DB
  useEffect(() => {
    if (!params.slug) return
    supabase
      .from('universities')
      .select('id')
      .eq('slug', params.slug)
      .single()
      .then(({ data }) => setUniId(data?.id ?? null))
  }, [params.slug])

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const buildQuery = useCallback((from: number) => {
    let query = supabase
      .from('products')
      .select(`
        id, seller_id, title, price, condition, category, image_url, views, description, created_at, whatsapp, in_stock,
        seller:profiles!seller_id (name, avatar_url, rating, is_verified)
      `)
      .eq('status', 'active')

    if (!allUnis && uniId) query = query.eq('university_id', uniId)

    if (debouncedSearch.trim()) {
      query = query.textSearch('search_vector', debouncedSearch.trim(), { type: 'websearch', config: 'english' })
    }
    if (condition) query = query.eq('condition', condition)
    if (category)  query = query.eq('category', category)

    if (sortBy === 'price-low')       query = query.order('price', { ascending: true })
    else if (sortBy === 'price-high') query = query.order('price', { ascending: false })
    else if (sortBy === 'popular')    query = query.order('views', { ascending: false })
    else                              query = query.order('created_at', { ascending: false })

    return query.range(from, from + PAGE_SIZE - 1)
  }, [uniId, debouncedSearch, condition, category, sortBy, allUnis])

  const fetchProducts = useCallback(async () => {
    if (!allUnis && uniId === null) return // wait for uni ID to resolve
    setLoading(true)
    offsetRef.current = 0
    try {
      const { data } = await buildQuery(0)
      const rows = (data as unknown as Product[]) ?? []
      setProducts(rows)
      setHasMore(rows.length === PAGE_SIZE)
    } catch {
      setProducts([])
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
      const rows = (data as unknown as Product[]) ?? []
      setProducts(prev => [...prev, ...rows])
      offsetRef.current = newOffset
      setHasMore(rows.length === PAGE_SIZE)
    } catch {
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => { fetchProducts() }, [fetchProducts])

  if (!uni) return notFound()

  const hasFilters = condition || category || search

  return (
    <>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ fontSize: '12px', color: '#888', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '6px' }}>
            <Link href={`/uni/${uni.slug}`} style={{ color: '#888', textDecoration: 'none' }}>
              {uni.shortName}
            </Link> · GOODS
          </div>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '44px', letterSpacing: '-1px', marginBottom: '4px' }}>
            {uni.shortName} GOODS
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {loading ? 'Loading...' : `${products.length}${hasMore ? '+' : ''} items${allUnis ? ' · all Ghana universities' : ` from ${uni.shortName} students`}`}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: '2px solid #111', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="container" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search goods..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '180px', padding: '10px 14px', border: '2px solid #111', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', fontWeight: 600, outline: 'none' }}
          />
          <select value={condition} onChange={e => setCondition(e.target.value)} style={{ padding: '10px 14px', border: '2px solid #111', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, cursor: 'pointer', background: '#fff', fontSize: '14px' }}>
            <option value="">All Conditions</option>
            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '10px 14px', border: '2px solid #111', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, cursor: 'pointer', background: '#fff', fontSize: '14px' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '10px 14px', border: '2px solid #111', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, cursor: 'pointer', background: '#fff', fontSize: '14px' }}>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="popular">Most Viewed</option>
          </select>
          <button
            onClick={() => setAllUnis(v => !v)}
            style={{
              padding: '10px 16px', border: '2px solid #111',
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
          {hasFilters && (
            <button onClick={() => { setCondition(''); setCategory(''); setSearch(''); setDebouncedSearch('') }} style={{ padding: '10px 18px', background: '#ff3366', color: '#fff', border: '2px solid #111', fontWeight: 700, cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px' }}>
              ✕ CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <SectionWrapper className="bg-[#f8f8f8]">
        {loading ? (
          <div className="product-grid">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} style={{ border: '2px solid #eee', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: '220px' }} />
                <div style={{ padding: '14px' }}>
                  <div className="skeleton" style={{ height: '16px', marginBottom: '10px', width: '85%' }} />
                  <div className="skeleton" style={{ height: '12px', width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: '#ccc' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', marginBottom: '10px' }}>
              {hasFilters ? 'NO RESULTS FOUND' : allUnis ? 'NO LISTINGS YET' : `NO LISTINGS AT ${uni.shortName.toUpperCase()} YET`}
            </div>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              {hasFilters ? 'Try adjusting your filters.' : 'Be the first to list an item!'}
            </p>
            <Link href={`/sell?uni=${uni.slug}`} className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '14px 32px' }}>
              + LIST FIRST ITEM →
            </Link>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '20px', fontWeight: 700, color: '#888', fontSize: '12px', letterSpacing: '1px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              SHOWING <strong style={{ color: '#111' }}>{products.length}</strong> ITEM{products.length !== 1 ? 'S' : ''}
              {allUnis && <span style={{ color: '#5d3fd3' }}> · ALL UNIVERSITIES</span>}
              {hasFilters && <span style={{ color: '#5d3fd3' }}> · FILTERED</span>}
            </p>
            <div className="product-grid">
              {products.map(p => (
                <GoodsCard key={p.id} good={{
                  id: p.id, name: p.title, price: p.price,
                  condition: p.condition as any, category: p.category as any,
                  seller: p.seller?.name ?? 'Student', sellerId: p.seller_id,
                  sellerImage: p.seller?.avatar_url ?? '/placeholder-user.jpg',
                  sellerRating: p.seller?.rating ?? 0, sellerVerified: p.seller?.is_verified ?? false,
                  image: p.image_url ?? '/placeholder.jpg', description: p.description ?? '',
                  createdAt: timeAgo(p.created_at), views: p.views, inStock: p.in_stock,
                }} />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{ padding: '14px 48px', background: loadingMore ? '#888' : '#111', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '14px', border: '2px solid #111', boxShadow: loadingMore ? 'none' : '4px 4px 0 #5d3fd3', cursor: loadingMore ? 'not-allowed' : 'pointer', letterSpacing: '0.5px' }}
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
