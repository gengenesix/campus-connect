"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import GoodsCard from '@/components/GoodsCard'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'

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
  seller: { name: string; avatar_url: string | null; rating: number; is_verified: boolean } | null
}

interface SP {
  q: string
  condition: string
  category: string
  sort: string
}

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Furniture', 'Sports', 'Other'] as const
const PAGE_SIZE = 20

export default function GoodsPageClient({
  initialProducts,
  sp,
}: {
  initialProducts: Product[]
  sp: SP
}) {
  const router = useRouter()
  const [search, setSearch] = useState(sp.q)
  const [condition, setCondition] = useState(sp.condition)
  const [category, setCategory] = useState(sp.category)
  const [sortBy, setSortBy] = useState(sp.sort)
  const [products, setProducts] = useState(initialProducts)
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const offsetRef = useRef(initialProducts.length)
  const isFirstRender = useRef(true)

  // Sync products list when server provides new initial data (after URL-triggered re-render)
  useEffect(() => {
    setProducts(initialProducts)
    offsetRef.current = initialProducts.length
    setHasMore(initialProducts.length === PAGE_SIZE)
  }, [initialProducts])

  // Push URL update when filters change (skip on initial mount)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    const delay = search !== sp.q ? 350 : 0
    const t = setTimeout(() => {
      const p = new URLSearchParams()
      if (search) p.set('q', search)
      if (condition) p.set('condition', condition)
      if (category) p.set('category', category)
      if (sortBy !== 'newest') p.set('sort', sortBy)
      router.replace(`/goods${p.size ? '?' + p.toString() : ''}`, { scroll: false })
    }, delay)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, condition, category, sortBy])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      if (search.trim()) {
        // Use /api/search (Meilisearch → Supabase fallback) when text search is active
        const page = Math.floor(offsetRef.current / PAGE_SIZE) + 2
        const p = new URLSearchParams({ q: search, type: 'products', page: String(page) })
        if (condition) p.set('condition', condition)
        if (category) p.set('category', category)
        if (sortBy !== 'newest') p.set('sort', sortBy)
        const res = await fetch(`/api/search?${p}`)
        const json = await res.json()
        const rows: Product[] = json.hits ?? []
        setProducts(prev => [...prev, ...rows])
        offsetRef.current += rows.length
        setHasMore(json.hasMore)
      } else {
        // Supabase direct for filter-only browsing
        const from = offsetRef.current + PAGE_SIZE
        let q = supabase
          .from('products')
          .select(`
            id, seller_id, title, price, condition, category, image_url, views, description, created_at, whatsapp, in_stock,
            seller:profiles!seller_id (name, avatar_url, rating, is_verified)
          `)
          .eq('status', 'active')
        if (condition) q = q.eq('condition', condition)
        if (category) q = q.eq('category', category)
        if (sortBy === 'price-low') q = q.order('price', { ascending: true })
        else if (sortBy === 'price-high') q = q.order('price', { ascending: false })
        else if (sortBy === 'popular') q = q.order('views', { ascending: false })
        else q = q.order('created_at', { ascending: false })
        const { data } = await q.range(from, from + PAGE_SIZE - 1)
        const rows = (data as unknown as Product[]) ?? []
        setProducts(prev => [...prev, ...rows])
        offsetRef.current = from
        setHasMore(rows.length === PAGE_SIZE)
      }
    } catch {}
    finally { setLoadingMore(false) }
  }

  const hasFilters = condition || category || search
  const clearFilters = () => { setCondition(''); setCategory(''); setSearch('') }

  return (
    <div>
      {/* Page Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', marginBottom: '6px', letterSpacing: '-1px' }}>
            BROWSE GOODS
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            {products.length} item{products.length !== 1 ? 's' : ''} from campus students · New listings daily
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#fff', borderBottom: '2px solid #111', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="container" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search goods..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '180px', padding: '10px 14px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', fontWeight: 600, outline: 'none' }}
          />
          <select value={condition} onChange={e => setCondition(e.target.value)} style={{ padding: '10px 14px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, cursor: 'pointer', background: '#fff', fontSize: '14px' }}>
            <option value="">All Conditions</option>
            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '10px 14px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, cursor: 'pointer', background: '#fff', fontSize: '14px' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '10px 14px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, cursor: 'pointer', background: '#fff', fontSize: '14px' }}>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="popular">Most Viewed</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} style={{ padding: '10px 18px', background: '#ff3366', color: '#fff', border: '2px solid #111', fontWeight: 700, cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontSize: '13px' }}>
              ✕ CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ background: '#f8f8f8', borderBottom: '1px solid #eee', padding: '12px 20px', overflowX: 'auto' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
          {(['All', ...CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              style={{
                padding: '6px 16px', whiteSpace: 'nowrap', border: '2px solid #111',
                fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '12px',
                cursor: 'pointer', letterSpacing: '0.5px',
                background: (cat === 'All' && !category) || category === cat ? '#111' : '#fff',
                color: (cat === 'All' && !category) || category === cat ? '#fff' : '#111',
                transition: 'all 0.15s',
              }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="container" style={{ paddingTop: '28px', paddingBottom: '60px' }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '28px', marginBottom: '10px' }}>
              {hasFilters ? 'NO RESULTS FOUND' : 'NO LISTINGS YET'}
            </div>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              {hasFilters ? 'Try adjusting your filters or search term' : 'Be the first to list an item on Campus Connect!'}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} className="btn-primary" style={{ cursor: 'pointer' }}>CLEAR FILTERS</button>
            ) : (
              <a href="/sell" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '14px 32px' }}>
                LIST FIRST ITEM →
              </a>
            )}
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '20px', fontWeight: 700, color: '#888', fontSize: '12px', letterSpacing: '1px', fontFamily: '"Space Grotesk", sans-serif' }}>
              SHOWING <strong style={{ color: '#111' }}>{products.length}</strong> ITEM{products.length !== 1 ? 'S' : ''}
              {hasFilters && <span style={{ color: '#5d3fd3' }}> · FILTERED</span>}
            </p>
            <div className="product-grid">
              {products.map(product => (
                <GoodsCard key={product.id} good={{
                  id: product.id,
                  name: product.title,
                  price: product.price,
                  condition: product.condition as any,
                  category: product.category as any,
                  seller: product.seller?.name ?? 'Student',
                  sellerId: product.seller_id,
                  sellerImage: product.seller?.avatar_url ?? '/placeholder-user.jpg',
                  sellerRating: product.seller?.rating ?? 0,
                  sellerVerified: product.seller?.is_verified ?? false,
                  image: product.image_url ?? '/placeholder.jpg',
                  description: product.description ?? '',
                  createdAt: timeAgo(product.created_at),
                  views: product.views,
                  inStock: product.in_stock,
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
                    background: loadingMore ? '#888' : '#111',
                    color: '#fff',
                    fontFamily: '"Archivo Black", sans-serif',
                    fontSize: '14px',
                    border: '2px solid #111',
                    boxShadow: loadingMore ? 'none' : '4px 4px 0 #5d3fd3',
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
    </div>
  )
}
