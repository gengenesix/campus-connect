"use client"

import React, { useState, useEffect } from 'react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GHANA_UNIVERSITIES, type UniversityType } from '@/lib/ghana-universities'
import GoodsCard from "@/components/GoodsCard"
import ServiceCard from "@/components/ServiceCard"
import type { Good, Service } from "@/lib/mockData"
import { timeAgo } from "@/lib/utils"

const SHOWCASE = [
  { label: 'BRAIDS', sublabel: 'Box braids, cornrows & locs', href: '/services', img: '/images/showcase/braids.jpg', tag: 'HAIR' },
  { label: 'NAIL ART', sublabel: 'Gel, acrylic & nail designs', href: '/services', img: '/images/showcase/nails.jpg', tag: 'BEAUTY' },
  { label: 'BARBER', sublabel: 'Fades, cuts & styling', href: '/services', img: '/images/showcase/barber.jpg', tag: 'GROOMING' },
  { label: 'CAMPUS FOOD', sublabel: 'Rice, stew & local dishes', href: '/goods', img: '/images/showcase/food.jpg', tag: 'FOOD' },
  { label: 'SOBOLO', sublabel: 'Cold & refreshing hibiscus drink', href: '/goods', img: '/images/showcase/sobolo.jpg', tag: 'FOOD & DRINK' },
  { label: 'LOCAL DRINKS', sublabel: 'Brukina, yoghurt & more', href: '/goods', img: '/images/showcase/drinks.jpg', tag: 'FOOD & DRINK' },
  { label: 'MILKSHAKES', sublabel: 'Cold blends & smoothies', href: '/goods', img: '/images/showcase/milkshakes.jpg', tag: 'FOOD & DRINK' },
  { label: 'PHONES & GADGETS', sublabel: 'Earbuds, cases & accessories', href: '/goods', img: '/images/showcase/phones.jpg', tag: 'ELECTRONICS' },
  { label: 'CALCULATORS', sublabel: 'Casio, Sharp & scientific', href: '/goods', img: '/images/showcase/calculator.jpg', tag: 'ACADEMICS' },
  { label: 'MAKEUPS', sublabel: 'Lip gloss, skincare & more', href: '/goods', img: '/images/showcase/lipcombo.jpg', tag: 'BEAUTY' },
  { label: 'BAGS', sublabel: 'Handbags, totes & clutches', href: '/goods', img: '/images/showcase/bags.jpg', tag: 'FASHION' },
  { label: 'PERFUMES', sublabel: 'Arabic, designer & local scents', href: '/goods', img: '/images/showcase/perfumes.jpg', tag: 'BEAUTY' },
  { label: 'JEWELLERY', sublabel: 'Bracelets, rings & necklaces', href: '/goods', img: '/images/showcase/jewelry.jpg', tag: 'FASHION' },
  { label: 'DELIVERY', sublabel: 'Fast campus delivery services', href: '/services', img: '/images/showcase/delivery.jpg', tag: 'SERVICE' },
  { label: 'TEXTBOOKS', sublabel: 'All subjects & levels', href: '/goods', img: '/images/showcase/textbooks.jpg', tag: 'ACADEMICS' },
]

const TICKER_ITEMS = [
  '43 UNIVERSITIES', 'BRAIDS', 'NAIL ART', 'BARBER', 'CAMPUS FOOD', 'SOBOLO',
  'LOCAL DRINKS', 'MILKSHAKES', 'PHONES & GADGETS', 'CALCULATORS', 'MAKEUPS',
  'BAGS', 'PERFUMES', 'JEWELLERY', 'DELIVERY', 'TEXTBOOKS', 'LAUNDRY', 'TUTORING',
  'TECH REPAIR', 'PHOTOGRAPHY', 'DESIGN',
]

const TYPE_COLOR: Record<UniversityType, string> = {
  public: '#1B5E20',
  technical: '#5d3fd3',
  private: '#b45309',
}

const HERO_PHOTOS = [
  { src: '/images/showcase/braids.jpg', alt: 'Braids service' },
  { src: '/images/showcase/nails.jpg', alt: 'Nail art' },
  { src: '/images/showcase/food.jpg', alt: 'Campus food' },
  { src: '/images/showcase/phones.jpg', alt: 'Phones & gadgets' },
]

const INITIAL_UNI_COUNT = 8

export default function HomePage() {
  const [goods, setGoods] = useState<Good[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [uniSearch, setUniSearch] = useState('')
  const [uniType, setUniType] = useState<'' | UniversityType>('')
  const [showAllUnis, setShowAllUnis] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchFeatured = async () => {
      const res = await fetch('/api/featured')
      if (!res.ok) { setLoadingData(false); return }
      const { goods: productsData, services: servicesData } = await res.json()
      setGoods(
        (productsData ?? []).map((p: any) => ({
          id: p.id, name: p.title, price: p.price, condition: p.condition,
          category: p.category ?? 'Other', seller: p.seller?.name ?? 'Student',
          sellerId: p.seller_id, sellerImage: p.seller?.avatar_url ?? '/placeholder-user.jpg',
          sellerRating: p.seller?.rating ?? 0, sellerVerified: p.seller?.is_verified ?? false,
          image: p.image_url ?? '/placeholder.jpg', description: p.description ?? '',
          createdAt: timeAgo(p.created_at), views: p.views ?? 0,
        }))
      )
      setServices(
        (servicesData ?? []).map((s: any) => ({
          id: s.id, name: s.name, provider: s.provider?.name ?? 'Student',
          providerId: s.provider_id, providerImage: s.provider?.avatar_url ?? '/placeholder-user.jpg',
          providerRating: s.provider?.rating ?? 0, providerVerified: s.provider?.is_verified ?? false,
          category: s.category, rate: s.rate ?? 'Contact for pricing',
          description: s.description ?? '', availability: s.availability ?? 'Contact provider',
          image: s.image_url ?? '/placeholder.jpg', responseTime: s.response_time ?? 'Varies',
          bookings: s.total_bookings ?? 0,
        }))
      )
      setLoadingData(false)
    }
    fetchFeatured()
  }, [])

  const tickerSet = [...TICKER_ITEMS, ...TICKER_ITEMS]

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) router.push(`/goods?q=${encodeURIComponent(q)}`)
  }

  const filteredUnis = GHANA_UNIVERSITIES.filter(u => {
    const matchesType = !uniType || u.type === uniType
    const q = uniSearch.toLowerCase()
    const matchesSearch = !q || u.shortName.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q)
    return matchesType && matchesSearch
  })

  const isUniFiltering = uniSearch.trim() !== '' || uniType !== ''
  const displayedUnis = (isUniFiltering || showAllUnis) ? filteredUnis : filteredUnis.slice(0, INITIAL_UNI_COUNT)
  const hasMoreUnis = !isUniFiltering && !showAllUnis && filteredUnis.length > INITIAL_UNI_COUNT
  const showGoods = loadingData || goods.length > 0
  const showServices = loadingData || services.length > 0

  return (
    <>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroPhotoIn {
          from { opacity: 0; transform: rotate(1.5deg) scale(0.96); }
          to { opacity: 1; transform: rotate(1.5deg) scale(1); }
        }
        .showcase-card:hover .showcase-overlay { background: linear-gradient(transparent 10%, rgba(0,0,0,0.94)) !important; }
        .showcase-card:hover img { transform: scale(1.07); }
        .showcase-card img { transition: transform 0.5s ease; }
        .showcase-card:hover .showcase-arrow { opacity: 1 !important; transform: translateX(0) !important; }
        .how-card:hover { transform: translate(-3px, -3px); box-shadow: 7px 7px 0 #111 !important; }
        .how-card { transition: all 0.2s; }
        .uni-card { transition: transform 0.15s, box-shadow 0.15s; cursor: pointer; }
        .uni-card:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 #111 !important; }
        .hero-photo-mosaic { animation: heroPhotoIn 0.7s ease 0.4s both; }
        .uni-expand-btn {
          padding: 12px 32px; border: 2px solid #111; background: #fff;
          font-family: "Archivo Black", sans-serif; font-size: 12px;
          letter-spacing: 1px; cursor: pointer; box-shadow: 3px 3px 0 #111; transition: all 0.15s;
        }
        .uni-expand-btn:hover { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 #111; }
        .showcase-scroll {
          overflow-x: auto;
          padding-left: max(20px, calc((100vw - 1240px) / 2));
          padding-right: 20px; padding-bottom: 16px;
          scrollbar-width: thin; scrollbar-color: #5d3fd3 #222;
        }
        .showcase-inner { display: flex; gap: 14px; width: max-content; }
        .showcase-item { width: 210px; height: 310px; flex-shrink: 0; }
        .hero-mobile-strip { display: none; }
        @media (max-width: 768px) {
          .showcase-scroll { overflow-x: visible; padding-left: 16px; padding-right: 16px; padding-bottom: 0; }
          .showcase-inner { display: grid; grid-template-columns: 1fr 1fr; width: 100%; gap: 10px; }
          .showcase-item { width: 100%; height: 180px; }
          .showcase-end-card { display: none; }
          .showcase-label { font-size: 15px !important; }
          .showcase-sublabel { display: none; }
          .uni-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .trust-grid { grid-template-columns: 1fr 1fr !important; gap: 20px !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .hero-photo-mosaic { display: none !important; }
          .hero-mobile-strip { display: block !important; width: 100%; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .showcase-item { width: 175px; height: 260px; }
          .uni-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .trust-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content" style={{ animation: 'fadeUp 0.55s ease both' }}>
          <div className="season-badge">
            GHANA'S CAMPUS MARKETPLACE · 43 UNIVERSITIES
          </div>
          <h1 className="hero-headline">
            BUY, SELL
            <br />
            &amp; <span className="hero-headline-highlight">CONNECT</span>
          </h1>
          <p className="hero-subtext">
            The free peer-to-peer marketplace for students across all Ghanaian universities. Buy goods, book campus services, connect with fellow students. Zero commission. Zero fees.
          </p>
          <div className="cta-buttons">
            <a href="#universities" className="btn-primary hover-lift" style={{ textDecoration: 'none' }}>FIND YOUR UNI →</a>
            <Link href="/goods" className="btn-secondary hover-lift">BROWSE GOODS</Link>
          </div>
          <form onSubmit={handleHeroSearch} className="hero-search-form">
            <input
              type="text"
              placeholder="Search goods & services across all unis..."
              className="hero-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="hero-search-btn">SEARCH</button>
          </form>
          <div className="social-proof">
            <div className="avatar-stack">
              <img src="/images/hero/avatar1.jpg" alt="Student" />
              <img src="/images/hero/avatar2.jpg" alt="Student" />
              <img src="/images/hero/avatar3.jpg" alt="Student" />
            </div>
            <div>
              <div className="social-proof-title">Ghana Campus Community</div>
              <div className="social-proof-subtitle">Students across 43 universities buying &amp; selling</div>
            </div>
          </div>
        </div>

        {/* RIGHT — 2×2 photo mosaic (desktop full, mobile strip) */}
        <div className="hero-visuals" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Desktop mosaic */}
          <div className="hero-photo-mosaic" style={{ position: 'relative', width: '100%', maxWidth: '460px' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
              transform: 'rotate(1.5deg)',
            }}>
              {HERO_PHOTOS.map((photo, i) => (
                <div
                  key={i}
                  style={{
                    height: 'clamp(130px, 16vw, 205px)',
                    border: '2px solid #111', overflow: 'hidden',
                    boxShadow: i === 0 ? '4px 4px 0 #111' : i === 3 ? '3px 3px 0 #5d3fd3' : 'none',
                    marginTop: i === 1 ? '22px' : i === 3 ? '-22px' : '0',
                    position: 'relative',
                  }}
                >
                  <img
                    src={photo.src} alt={photo.alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
                  />
                  {i === 0 && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: '#1B5E20', color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', padding: '3px 8px', fontFamily: '"Space Grotesk", sans-serif' }}>
                      SERVICES
                    </div>
                  )}
                  {i === 2 && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: '#5d3fd3', color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', padding: '3px 8px', fontFamily: '"Space Grotesk", sans-serif' }}>
                      GOODS
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{
              position: 'absolute', bottom: '-10px', right: '4px',
              background: '#111', color: '#fff',
              fontFamily: '"Archivo Black", sans-serif', fontSize: '10px',
              letterSpacing: '2px', padding: '6px 14px', border: '2px solid #111',
            }}>
              43 UNIS · ZERO FEES
            </div>
          </div>

          {/* Mobile hero image strip — shows below text on small screens */}
          <div className="hero-mobile-strip">
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
              {HERO_PHOTOS.map((photo, i) => (
                <div key={i} style={{ flexShrink: 0, width: '42vw', maxWidth: '160px', height: '130px', border: '2px solid #111', overflow: 'hidden', position: 'relative' }}>
                  <img src={photo.src} alt={photo.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg' }} />
                  {i === 0 && <div style={{ position: 'absolute', bottom: 6, left: 6, background: '#1B5E20', color: '#fff', fontSize: '8px', fontWeight: 700, letterSpacing: '1px', padding: '2px 6px', fontFamily: '"Space Grotesk", sans-serif' }}>SERVICES</div>}
                  {i === 2 && <div style={{ position: 'absolute', bottom: 6, left: 6, background: '#5d3fd3', color: '#fff', fontSize: '8px', fontWeight: 700, letterSpacing: '1px', padding: '2px 6px', fontFamily: '"Space Grotesk", sans-serif' }}>GOODS</div>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#999', fontWeight: 600, letterSpacing: '0.5px' }}>43 UNIS · ZERO FEES · ZERO COMMISSION</div>
          </div>
        </div>
      </section>

      {/* TICKER — dark with green separators */}
      <div style={{ background: '#111', borderTop: '2px solid #333', borderBottom: '2px solid #333', padding: '11px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'ticker 30s linear infinite', width: 'max-content' }}>
          {tickerSet.map((item, i) => (
            <span key={i} style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', padding: '0 20px' }}>
              {item}
              <span style={{ color: '#1B5E20', marginLeft: '20px', fontWeight: 900 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ background: '#111', color: '#fff', padding: '32px 20px', borderBottom: '2px solid #1a1a1a' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '24px', textAlign: 'center' }}>
          {[
            { num: '43', label: 'UNIVERSITIES' },
            { num: '0%', label: 'COMMISSION' },
            { num: '100%', label: 'FREE FOREVER' },
            { num: 'P2P', label: 'DIRECT DEALS' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(28px, 5vw, 42px)', color: '#a78bfa', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#555', marginTop: '6px', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* UNIVERSITY FINDER — search-first */}
      <section id="universities" style={{ background: '#fff', padding: '72px 20px', borderBottom: '2px solid #111' }}>
        <div className="container">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#1B5E20', color: '#fff', padding: '6px 16px',
              fontFamily: '"Space Grotesk", sans-serif', fontSize: '11px',
              fontWeight: 700, letterSpacing: '2px', marginBottom: '20px',
              border: '1.5px solid #111',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="9" width="18" height="12" /><path d="M3 9l9-6 9 6" /><path d="M9 21V12h6v9" />
              </svg>
              EVERY ACCREDITED UNIVERSITY IN GHANA
            </div>
            <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 0.95, margin: 0, letterSpacing: '-1px' }}>
              FIND YOUR<br /><span style={{ color: '#1B5E20' }}>CAMPUS</span>
            </h2>
            <p style={{ color: '#666', fontSize: '16px', marginTop: '16px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              Campus Connect serves all 43 accredited universities in Ghana — public, technical, and private.
            </p>
          </div>

          {/* Search bar — prominent */}
          <div style={{ maxWidth: '560px', margin: '0 auto 36px', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#999" strokeWidth="2.2" strokeLinecap="round"
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Type your university name or city..."
                value={uniSearch}
                onChange={e => { setUniSearch(e.target.value); if (e.target.value) setShowAllUnis(true) }}
                style={{
                  width: '100%', padding: '16px 56px 16px 48px',
                  border: '2px solid #111', fontSize: '15px',
                  fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600,
                  outline: 'none', background: '#fff', boxSizing: 'border-box',
                  boxShadow: '4px 4px 0 #111', transition: 'box-shadow 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.boxShadow = '4px 4px 0 #1B5E20')}
                onBlur={e => (e.currentTarget.style.boxShadow = '4px 4px 0 #111')}
              />
              {uniSearch && (
                <button
                  onClick={() => setUniSearch('')}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '18px', lineHeight: 1, padding: '4px 6px' }}
                >×</button>
              )}
            </div>

            {/* Type filter pills */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              {([['', 'ALL TYPES'], ['public', 'PUBLIC'], ['technical', 'TECHNICAL'], ['private', 'PRIVATE']] as const).map(([val, label]) => (
                <button
                  key={label}
                  onClick={() => { setUniType(val as '' | UniversityType); if (val) setShowAllUnis(true) }}
                  style={{
                    padding: '7px 14px', border: '1.5px solid',
                    borderColor: uniType === val ? '#111' : '#ddd',
                    fontFamily: '"Space Grotesk", sans-serif', fontSize: '11px',
                    fontWeight: 700, letterSpacing: '0.5px', cursor: 'pointer',
                    background: uniType === val ? '#111' : '#fff',
                    color: uniType === val ? '#fff' : '#555',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center' }}>
                {filteredUnis.length} universities
              </span>
            </div>
          </div>

          {/* University grid */}
          <div className="uni-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {displayedUnis.map(uni => (
              <Link key={uni.slug} href={`/uni/${uni.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="uni-card" style={{
                  border: '2px solid #e8e8e8', borderTop: `3px solid ${TYPE_COLOR[uni.type]}`,
                  background: '#fff', padding: '16px',
                  transition: 'all 0.15s', cursor: 'pointer',
                  height: '100%', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ fontSize: '9px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, letterSpacing: '1.5px', color: TYPE_COLOR[uni.type], marginBottom: '6px', textTransform: 'uppercase' }}>
                    {uni.type}
                  </div>
                  <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', lineHeight: 1, marginBottom: '5px', color: '#111', letterSpacing: '-0.5px' }}>
                    {uni.shortName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.45, flexGrow: 1, marginBottom: '10px' }}>
                    {uni.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f5f5f5', paddingTop: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 600 }}>{uni.city}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredUnis.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#888', border: '2px dashed #ddd', maxWidth: '400px', margin: '0 auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: '12px' }}>
                <rect x="3" y="9" width="18" height="12" /><path d="M3 9l9-6 9 6" /><path d="M9 21V12h6v9" />
              </svg>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', marginBottom: '6px' }}>NO MATCH FOUND</div>
              <p style={{ fontSize: '13px' }}>Try a different name or city.</p>
            </div>
          )}

          {/* Expand/collapse */}
          <div style={{ textAlign: 'center', marginTop: '28px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {hasMoreUnis && (
              <button className="uni-expand-btn" onClick={() => setShowAllUnis(true)}>
                VIEW ALL {filteredUnis.length} UNIVERSITIES ↓
              </button>
            )}
            {!isUniFiltering && showAllUnis && filteredUnis.length > INITIAL_UNI_COUNT && (
              <button className="uni-expand-btn" onClick={() => { setShowAllUnis(false); setTimeout(() => document.getElementById('universities')?.scrollIntoView({ behavior: 'smooth' }), 50) }}>
                SHOW LESS ↑
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', background: TYPE_COLOR.public, display: 'inline-block' }} /> Public
            </span>
            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', background: TYPE_COLOR.technical, display: 'inline-block' }} /> Technical
            </span>
            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', background: TYPE_COLOR.private, display: 'inline-block' }} /> Private
            </span>
          </div>
        </div>
      </section>

      {/* WHAT'S ON CAMPUS showcase scroll */}
      <section style={{ background: '#0a0a0a', padding: '64px 0 48px', overflow: 'hidden' }}>
        <div className="container" style={{ marginBottom: '32px', paddingLeft: 20, paddingRight: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#a78bfa', marginBottom: '10px' }}>
                CAMPUS MARKET
              </div>
              <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(32px, 5vw, 52px)', color: '#fff', lineHeight: 1, margin: 0 }}>
                WHAT&apos;S ON<br /><span style={{ color: '#a78bfa' }}>CAMPUS</span>
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/goods" style={{ padding: '10px 22px', border: '1px solid #333', color: '#aaa', fontSize: '12px', fontWeight: 700, textDecoration: 'none', letterSpacing: '1px', fontFamily: '"Space Grotesk", sans-serif' }}>
                BROWSE GOODS
              </Link>
              <Link href="/services" style={{ padding: '10px 22px', background: '#5d3fd3', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', letterSpacing: '1px', fontFamily: '"Archivo Black", sans-serif', border: '1px solid #5d3fd3' }}>
                BOOK SERVICES
              </Link>
            </div>
          </div>
        </div>
        <div className="showcase-scroll">
          <div className="showcase-inner">
            {SHOWCASE.map(item => (
              <Link key={item.label} href={item.href} className="showcase-card showcase-item" style={{ textDecoration: 'none', display: 'block', position: 'relative', overflow: 'hidden', border: '2px solid #2a2a2a', cursor: 'pointer' }}>
                <img src={item.img} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg' }} loading="lazy" />
                <div className="showcase-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.85))', transition: 'background 0.3s' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 12px 12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#a78bfa', marginBottom: '4px', fontFamily: '"Space Grotesk", sans-serif' }}>{item.tag}</div>
                  <div className="showcase-label" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', color: '#fff', lineHeight: 1.1, marginBottom: '2px' }}>{item.label}</div>
                  <div className="showcase-sublabel" style={{ fontSize: '11px', color: '#ccc', marginBottom: '6px' }}>{item.sublabel}</div>
                  <div className="showcase-arrow" style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, letterSpacing: '1px', fontFamily: '"Space Grotesk", sans-serif', opacity: 0, transform: 'translateX(-6px)', transition: 'all 0.25s' }}>SHOP NOW →</div>
                </div>
              </Link>
            ))}
            <Link href="/goods" className="showcase-end-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '150px', flexShrink: 0, border: '2px dashed #333', color: '#666', gap: '12px' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', color: '#5d3fd3' }}>+</div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', color: '#888', textAlign: 'center', lineHeight: 1.4 }}>200+<br />MORE ITEMS</div>
              <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, letterSpacing: '1px' }}>BROWSE ALL →</div>
            </Link>
          </div>
        </div>
      </section>

      {/* LATEST GOODS — hidden if empty */}
      {showGoods && (
        <section className="trending-section" id="featured">
          <div className="container">
            <div className="trending-header">
              <h3>Latest Goods</h3>
              <Link href="/goods">See All →</Link>
            </div>
            {loadingData ? (
              <div className="product-grid">
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ border: '2px solid #eee', overflow: 'hidden' }}>
                    <div className="skeleton" style={{ height: '220px' }} />
                    <div style={{ padding: '14px 16px 16px' }}>
                      <div className="skeleton" style={{ height: '16px', marginBottom: '10px', width: '85%' }} />
                      <div className="skeleton" style={{ height: '12px', width: '60%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="product-grid">
                {goods.map(good => <GoodsCard key={good.id} good={good} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* POPULAR SERVICES — hidden if empty */}
      {showServices && (
        <section className="trending-section" style={{ background: '#f5f5f5' }}>
          <div className="container">
            <div className="trending-header">
              <h3>Popular Services</h3>
              <Link href="/services">See All →</Link>
            </div>
            {loadingData ? (
              <div className="product-grid">
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ border: '2px solid #eee', overflow: 'hidden' }}>
                    <div className="skeleton" style={{ height: '4px' }} />
                    <div className="skeleton" style={{ height: '200px' }} />
                    <div style={{ padding: '14px 16px 16px' }}>
                      <div className="skeleton" style={{ height: '16px', marginBottom: '10px', width: '80%' }} />
                      <div className="skeleton" style={{ height: '12px', width: '55%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="product-grid">
                {services.map(service => <ServiceCard key={service.id} service={service} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section style={{ background: '#fff', padding: '60px 20px', borderTop: '2px solid #111' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#5d3fd3', marginBottom: '12px' }}>SIMPLE PROCESS</div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(28px, 5vw, 40px)', marginBottom: '8px' }}>HOW IT WORKS</div>
            <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>Three simple steps to buy, sell, or book on campus</p>
          </div>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {([
              {
                step: '01', title: 'Find Your Uni', accent: '#1B5E20',
                desc: 'Select your university and browse your campus marketplace — only students from your school.',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="3" />
                    <path d="M12 2a8 8 0 0 1 8 8c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 8-8z" />
                  </svg>
                ),
              },
              {
                step: '02', title: 'List or Browse', accent: '#5d3fd3',
                desc: 'Post items for sale or find goods and services offered by fellow students near you.',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#5d3fd3" strokeWidth="1.75" strokeLinecap="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                ),
              },
              {
                step: '03', title: 'Connect & Deal', accent: '#ff3366',
                desc: 'Message sellers directly, book services, and meet safely on campus. Zero fees.',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff3366" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                ),
              },
            ] as { step: string; title: string; accent: string; desc: string; icon: React.ReactNode }[]).map(item => (
              <div key={item.step} className="how-card" style={{ border: '2px solid #111', borderTop: `4px solid ${item.accent}`, padding: '32px 28px', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
                <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '52px', color: '#f0f0f0', lineHeight: 1, marginBottom: '4px' }}>{item.step}</div>
                <div style={{ marginBottom: '16px' }}>{item.icon}</div>
                <h3 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', marginBottom: '10px', color: '#111' }}>{item.title}</h3>
                <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP — dark, left-bordered */}
      <section style={{ background: '#111', padding: '48px 20px', borderTop: '2px solid #1a1a1a' }}>
        <div className="container">
          <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
            {([
              {
                title: 'SAFE & VERIFIED', desc: 'All users are real students. Meet safely on campus.', accent: '#1B5E20',
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                ),
              },
              {
                title: 'ZERO COMMISSION', desc: 'Keep 100% of what you earn. Always free.', accent: '#a78bfa',
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
                    <line x1="19" y1="5" x2="5" y2="19" />
                    <circle cx="6.5" cy="6.5" r="2.5" />
                    <circle cx="17.5" cy="17.5" r="2.5" />
                  </svg>
                ),
              },
              {
                title: 'INSTANT CONTACT', desc: 'Direct WhatsApp — no middlemen, no delays.', accent: '#ff3366',
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff3366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
              },
              {
                title: '43 UNIVERSITIES', desc: 'Every accredited university in Ghana, one platform.', accent: '#5d3fd3',
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#5d3fd3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="9" width="18" height="12" />
                    <path d="M3 9l9-6 9 6" />
                    <path d="M9 21V12h6v9" />
                  </svg>
                ),
              },
            ] as { title: string; desc: string; accent: string; icon: React.ReactNode }[]).map(item => (
              <div key={item.title} style={{ borderLeft: `3px solid ${item.accent}`, paddingLeft: '20px' }}>
                <span style={{ display: 'block', marginBottom: '12px' }}>{item.icon}</span>
                <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', marginBottom: '6px', color: '#fff', letterSpacing: '0.5px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.55 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1B5E20', padding: '64px 20px', textAlign: 'center', color: '#fff', borderTop: '3px solid #111' }}>
        <div className="container">
          <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: 'rgba(255,255,255,0.55)', marginBottom: '16px' }}>JOIN THE COMMUNITY</div>
          <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(28px, 5vw, 42px)', marginBottom: '16px', lineHeight: 1.1 }}>
            READY TO JOIN<br />YOUR CAMPUS?
          </h2>
          <p style={{ fontSize: '17px', maxWidth: '500px', margin: '0 auto 36px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.65 }}>
            Free forever. No commission. No hidden fees. Just pure campus community across all 43 Ghana universities.
          </p>
          <div className="cta-buttons" style={{ justifyContent: 'center' }}>
            <Link href="/auth/register" style={{ display: 'inline-block', padding: '18px 48px', background: '#fff', color: '#1B5E20', fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', textDecoration: 'none', border: '2px solid #fff', boxShadow: '4px 4px 0 rgba(0,0,0,0.25)' }}>
              JOIN FREE
            </Link>
            <a href="#universities" style={{ display: 'inline-block', padding: '18px 48px', background: 'transparent', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)' }}>
              FIND YOUR UNI
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
