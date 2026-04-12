"use client"

import { useState, useEffect, useCallback } from "react"
import GoodsCard from "@/components/GoodsCard"
import { supabase } from "@/lib/supabase"
import { timeAgo } from "@/lib/utils"

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
  seller: {
    name: string
    avatar_url: string | null
    rating: number
    is_verified: boolean
  } | null
}

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Furniture', 'Sports', 'Other'] as const

export default function GoodsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [condition, setCondition] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // Populate search from ?q= URL param on first load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('q')
      if (q) { setSearch(q); setDebouncedSearch(q) }
    }
  }, [])

  // Debounce text input — wait 350ms before hitting the DB
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Server-side filtered fetch — runs whenever any filter changes
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          id, seller_id, title, price, condition, category, image_url, views, description, created_at, whatsapp,
          seller:profiles!seller_id (name, avatar_url, rating, is_verified)
        `)
        .neq('status', 'deleted')

      // Full-text search via GIN index (much faster than ILIKE at scale)
      if (debouncedSearch.trim()) {
        query = query.textSearch('search_vector', debouncedSearch.trim(), {
          type: 'websearch',
          config: 'english',
        })
      }

      if (condition) query = query.eq('condition', condition)
      if (category)  query = query.eq('category', category)

      if (sortBy === 'price-low')  query = query.order('price', { ascending: true })
      else if (sortBy === 'price-high') query = query.order('price', { ascending: false })
      else if (sortBy === 'popular')    query = query.order('views', { ascending: false })
      else                              query = query.order('created_at', { ascending: false })

      const { data } = await query
      setProducts((data as Product[]) ?? [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, condition, category, sortBy])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const hasFilters = condition || category || search

  if (loading) {
    return (
      <div>
        <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
          <div className="container">
            <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', marginBottom: '6px', letterSpacing: '-1px' }}>BROWSE GOODS</h1>
          </div>
        </div>
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
          <div className="product-grid">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} style={{ border: '2px solid #eee', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: '220px' }} />
                <div style={{ padding: '14px 16px 16px' }}>
                  <div className="skeleton" style={{ height: '16px', marginBottom: '10px', width: '85%' }} />
                  <div className="skeleton" style={{ height: '12px', marginBottom: '6px', width: '55%' }} />
                  <div className="skeleton" style={{ height: '12px', marginBottom: '20px', width: '40%' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ height: '22px', width: '35%' }} />
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
      {/* Page Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', marginBottom: '6px', letterSpacing: '-1px' }}>
            BROWSE GOODS
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            {products.length} item{products.length !== 1 ? 's' : ''} from UMaT students · New listings daily
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
            style={{
              flex: 1, minWidth: '180px', padding: '10px 14px',
              border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif',
              fontSize: '14px', fontWeight: 600, outline: 'none',
            }}
          />
          <select
            value={condition}
            onChange={e => setCondition(e.target.value)}
            style={{ padding: '10px 14px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, cursor: 'pointer', background: '#fff', fontSize: '14px' }}
          >
            <option value="">All Conditions</option>
            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ padding: '10px 14px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, cursor: 'pointer', background: '#fff', fontSize: '14px' }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ padding: '10px 14px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, cursor: 'pointer', background: '#fff', fontSize: '14px' }}
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="popular">Most Viewed</option>
          </select>
          {hasFilters && (
            <button
              onClick={() => { setCondition(''); setCategory(''); setSearch(''); setDebouncedSearch('') }}
              style={{ padding: '10px 18px', background: '#ff3366', color: '#fff', border: '2px solid #111', fontWeight: 700, cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontSize: '13px' }}
            >
              ✕ CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ background: '#f8f8f8', borderBottom: '1px solid #eee', padding: '12px 20px', overflowX: 'auto' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              style={{
                padding: '6px 16px', whiteSpace: 'nowrap',
                border: '2px solid #111',
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
              <button
                onClick={() => { setCondition(''); setCategory(''); setSearch(''); setDebouncedSearch('') }}
                className="btn-primary"
                style={{ cursor: 'pointer' }}
              >
                CLEAR FILTERS
              </button>
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
                  seller: product.seller?.name ?? 'UMaT Student',
                  sellerId: product.seller_id,
                  sellerImage: product.seller?.avatar_url ?? '/placeholder-user.jpg',
                  sellerRating: product.seller?.rating ?? 0,
                  sellerVerified: product.seller?.is_verified ?? false,
                  image: product.image_url ?? '/placeholder.jpg',
                  description: product.description ?? '',
                  createdAt: timeAgo(product.created_at),
                  views: product.views,
                }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
