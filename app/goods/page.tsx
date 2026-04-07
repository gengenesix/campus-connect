"use client"

import { useState } from "react"
import GoodsCard from "@/components/GoodsCard"
import { mockGoods } from "@/lib/mockData"

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Furniture', 'Sports', 'Other'] as const

export default function GoodsPage() {
  const [condition, setCondition] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const filtered = mockGoods
    .filter(g => {
      if (condition && g.condition !== condition) return false
      if (category && g.category !== category) return false
      if (search && !g.name.toLowerCase().includes(search.toLowerCase()) &&
          !g.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'popular') return b.views - a.views
      return 0
    })

  const hasFilters = condition || category || search

  return (
    <div>
      {/* Page Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', marginBottom: '6px', letterSpacing: '-1px' }}>
            BROWSE GOODS
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            {mockGoods.length} items from UMaT students · New listings daily
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
              onClick={() => { setCondition(''); setCategory(''); setSearch('') }}
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
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '28px', marginBottom: '10px' }}>
              NO RESULTS FOUND
            </div>
            <p style={{ color: '#666', marginBottom: '24px' }}>Try adjusting your filters or search term</p>
            <button
              onClick={() => { setCondition(''); setCategory(''); setSearch('') }}
              className="btn-primary"
              style={{ cursor: 'pointer' }}
            >
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '20px', fontWeight: 700, color: '#888', fontSize: '12px', letterSpacing: '1px', fontFamily: '"Space Grotesk", sans-serif' }}>
              SHOWING <strong style={{ color: '#111' }}>{filtered.length}</strong> ITEM{filtered.length !== 1 ? 'S' : ''}
              {hasFilters && <span style={{ color: '#5d3fd3' }}> · FILTERED</span>}
            </p>
            <div className="product-grid">
              {filtered.map(good => (
                <GoodsCard key={good.id} good={good} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
