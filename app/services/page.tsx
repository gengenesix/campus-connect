"use client"

import { useState } from "react"
import ServiceCard from "@/components/ServiceCard"
import { mockServices } from "@/lib/mockData"

const CATEGORIES = ['Barbing', 'Tutoring', 'Photography', 'Laundry', 'Tech Repair', 'Design', 'Other'] as const

export default function ServicesPage() {
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  const filtered = mockServices.filter(s => {
    if (category && s.category !== category) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.provider.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', marginBottom: '6px', letterSpacing: '-1px' }}>
            CAMPUS SERVICES
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            {mockServices.length} services from UMaT students · Book directly on campus
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
              NO SERVICES FOUND
            </div>
            <p style={{ color: '#666', marginBottom: '24px' }}>Try a different category or search term</p>
            <button onClick={() => { setCategory(''); setSearch('') }} className="btn-primary" style={{ cursor: 'pointer' }}>
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '20px', fontWeight: 600, color: '#888', fontSize: '14px' }}>
              Showing <strong style={{ color: '#111' }}>{filtered.length}</strong> service{filtered.length !== 1 ? 's' : ''}
              {category && ` in ${category}`}
            </p>
            <div className="product-grid">
              {filtered.map(service => (
                <ServiceCard key={service.id} service={service} />
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
