"use client"

import { useState, useEffect } from 'react'
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

export default function HomePage() {
  const [goods, setGoods] = useState<Good[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [uniSearch, setUniSearch] = useState('')
  const [uniType, setUniType] = useState<'' | UniversityType>('')
  const router = useRouter()

  useEffect(() => {
    const fetchFeatured = async () => {
      const res = await fetch('/api/featured')
      if (!res.ok) { setLoadingData(false); return }
      const { goods: productsData, services: servicesData } = await res.json()

      setGoods(
        (productsData ?? []).map((p: any) => ({
          id: p.id,
          name: p.title,
          price: p.price,
          condition: p.condition,
          category: p.category ?? 'Other',
          seller: p.seller?.name ?? 'Student',
          sellerId: p.seller_id,
          sellerImage: p.seller?.avatar_url ?? '/placeholder-user.jpg',
          sellerRating: p.seller?.rating ?? 0,
          sellerVerified: p.seller?.is_verified ?? false,
          image: p.image_url ?? '/placeholder.jpg',
          description: p.description ?? '',
          createdAt: timeAgo(p.created_at),
          views: p.views ?? 0,
        }))
      )

      setServices(
        (servicesData ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          provider: s.provider?.name ?? 'Student',
          providerId: s.provider_id,
          providerImage: s.provider?.avatar_url ?? '/placeholder-user.jpg',
          providerRating: s.provider?.rating ?? 0,
          providerVerified: s.provider?.is_verified ?? false,
          category: s.category,
          rate: s.rate ?? 'Contact for pricing',
          description: s.description ?? '',
          availability: s.availability ?? 'Contact provider',
          image: s.image_url ?? '/placeholder.jpg',
          responseTime: s.response_time ?? 'Varies',
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

  return (
    <>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .showcase-card:hover .showcase-overlay {
          background: linear-gradient(transparent 10%, rgba(0,0,0,0.94)) !important;
        }
        .showcase-card:hover img { transform: scale(1.07); }
        .showcase-card img { transition: transform 0.5s ease; }
        .showcase-card:hover .showcase-arrow { opacity: 1 !important; transform: translateX(0) !important; }
        .how-card:hover { transform: translate(-3px, -3px); box-shadow: 7px 7px 0 #111 !important; }
        .how-card { transition: all 0.2s; }
        .uni-card { transition: transform 0.15s, box-shadow 0.15s; cursor: pointer; }
        .uni-card:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 #111 !important; }
        .showcase-scroll {
          overflow-x: auto;
          padding-left: max(20px, calc((100vw - 1240px) / 2));
          padding-right: 20px;
          padding-bottom: 16px;
          scrollbar-width: thin;
          scrollbar-color: #a78bfa #222;
        }
        .showcase-inner { display: flex; gap: 14px; width: max-content; }
        .showcase-item { width: 210px; height: 310px; flex-shrink: 0; }
        @media (max-width: 768px) {
          .showcase-scroll { overflow-x: visible; padding-left: 16px; padding-right: 16px; padding-bottom: 0; }
          .showcase-inner { display: grid; grid-template-columns: 1fr 1fr; width: 100%; gap: 10px; }
          .showcase-item { width: 100%; height: 180px; }
          .showcase-end-card { display: none; }
          .showcase-label { font-size: 15px !important; }
          .showcase-sublabel { display: none; }
          .uni-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .showcase-item { width: 175px; height: 260px; }
          .uni-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="season-badge">GHANA'S CAMPUS MARKETPLACE · 43 UNIVERSITIES</div>
          <h1 className="hero-headline">
            BUY, SELL
            <br />
            &amp; <span className="hero-headline-highlight">CONNECT</span>
          </h1>
          <p className="hero-subtext">
            The free peer-to-peer marketplace for students across all Ghanaian universities. Buy goods, book campus services, connect with fellow students. Zero commission. Zero fees.
          </p>
          <div className="cta-buttons">
            <a href="#universities" className="btn-primary hover-lift" style={{ textDecoration: 'none' }}>
              FIND YOUR UNI →
            </a>
            <Link href="/goods" className="btn-secondary hover-lift">
              BROWSE GOODS
            </Link>
          </div>

          {/* Inline search */}
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
              <img src="/images/hero/avatar1.jpg" alt="Campus Student" />
              <img src="/images/hero/avatar2.jpg" alt="Campus Student" />
              <img src="/images/hero/avatar3.jpg" alt="Campus Student" />
            </div>
            <div>
              <div className="social-proof-title">Ghana Campus Community</div>
              <div className="social-proof-subtitle">Students across 43 universities buying &amp; selling</div>
            </div>
          </div>
        </div>

        {/* Right Visual Collage */}
        <div className="hero-visuals">
          <svg className="abstract-shape" width="600" height="600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#1B5E20" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,31.6C59,41.7,47.1,49,35.3,55.1C23.5,61.2,11.8,66.1,-0.6,67.1C-12.9,68.1,-25.8,65.2,-37.9,59.2C-50,53.2,-61.3,44.1,-70.5,32.6C-79.7,21.1,-86.8,7.2,-85.1,-6.1C-83.3,-19.4,-72.7,-32.1,-61.6,-41.8C-50.5,-51.5,-38.9,-58.2,-27.1,-66.9C-15.3,-75.6,-3.3,-86.3,10.2,-83.8C23.7,-81.3,30.5,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
          <div className="main-image-container">
            <img src="/images/hero/main.jpg" alt="Ghana university students" />
            <div className="price-tag" style={{ backgroundColor: '#1B5E20', color: '#fff' }}>FREE</div>
          </div>
          <div className="secondary-image">
            <img src="/images/hero/secondary.jpg" alt="Campus students" />
          </div>
          <div className="sticker-graphic">
            <img src="/images/hero/sticker.jpg" alt="Happy campus student" />
            <div className="hot-badge">LIVE</div>
          </div>
          <svg className="decorative-star" width="80" height="80" viewBox="0 0 24 24" fill="#1B5E20" stroke="#000" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      </section>

      {/* ── Ticker Strip ─────────────────────────────────────────────────── */}
      <div style={{ background: '#a78bfa', borderTop: '2px solid #111', borderBottom: '2px solid #111', padding: '12px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'ticker 30s linear infinite', width: 'max-content' }}>
          {tickerSet.map((item, i) => (
            <span key={i} style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', color: '#111', whiteSpace: 'nowrap', padding: '0 28px', borderRight: '2px solid rgba(0,0,0,0.15)' }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <div style={{ background: '#111', color: '#fff', padding: '28px 20px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', textAlign: 'center' }}>
          {[
            { num: '43', label: 'UNIVERSITIES' },
            { num: '0%', label: 'COMMISSION' },
            { num: '100%', label: 'FREE FOREVER' },
            { num: 'P2P', label: 'DIRECT DEALS' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px', color: '#a78bfa' }}>{s.num}</div>
              <div style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#666', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── University Finder ─────────────────────────────────────────────── */}
      <section id="universities" style={{ background: '#f8f8f8', padding: '64px 20px', borderBottom: '2px solid #111' }}>
        <div className="container">
          {/* Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#5d3fd3', marginBottom: '8px' }}>
                ALL 43 INSTITUTIONS
              </div>
              <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1, margin: 0 }}>
                FIND YOUR<br />
                <span style={{ color: '#1B5E20' }}>UNIVERSITY</span>
              </h2>
            </div>
            <p style={{ color: '#666', fontSize: '14px', maxWidth: '280px', textAlign: 'right', lineHeight: 1.6 }}>
              Select your institution to browse goods &amp; services from your campus community
            </p>
          </div>

          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search universities..."
              value={uniSearch}
              onChange={e => setUniSearch(e.target.value)}
              style={{
                flex: '1', minWidth: '200px', maxWidth: '360px',
                padding: '10px 16px', border: '2px solid #111',
                fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px',
                fontWeight: 600, outline: 'none', background: '#fff',
              }}
            />
            {([['', 'ALL'], ['public', 'PUBLIC'], ['technical', 'TECHNICAL'], ['private', 'PRIVATE']] as const).map(([val, label]) => (
              <button
                key={label}
                onClick={() => setUniType(val as '' | UniversityType)}
                style={{
                  padding: '10px 18px', border: '2px solid #111',
                  fontFamily: '"Archivo Black", sans-serif', fontSize: '11px',
                  letterSpacing: '0.5px', cursor: 'pointer',
                  background: uniType === val ? '#111' : '#fff',
                  color: uniType === val ? '#fff' : '#111',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* University Grid */}
          <div
            className="uni-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}
          >
            {filteredUnis.map(uni => (
              <Link
                key={uni.slug}
                href={`/uni/${uni.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="uni-card"
                  style={{
                    border: '2px solid #111',
                    borderTop: `4px solid ${TYPE_COLOR[uni.type]}`,
                    background: '#fff',
                    padding: '16px',
                    boxShadow: '3px 3px 0 #111',
                    height: '100%',
                  }}
                >
                  <div style={{ fontSize: '9px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, letterSpacing: '1.5px', color: TYPE_COLOR[uni.type], marginBottom: '6px' }}>
                    {uni.type.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', lineHeight: 1, marginBottom: '6px', color: '#111' }}>
                    {uni.shortName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.4, marginBottom: '8px' }}>
                    {uni.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#999', fontWeight: 700, letterSpacing: '0.5px' }}>
                    {uni.city} · {uni.region}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredUnis.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#888' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', marginBottom: '8px' }}>NO UNIVERSITIES FOUND</div>
              <p>Try a different search term or clear the filter.</p>
            </div>
          )}

          <p style={{ marginTop: '20px', fontSize: '12px', color: '#999', fontWeight: 600 }}>
            Showing {filteredUnis.length} of {GHANA_UNIVERSITIES.length} institutions ·
            <span style={{ color: TYPE_COLOR.public }}> ■ Public</span>
            <span style={{ color: TYPE_COLOR.technical }}> ■ Technical</span>
            <span style={{ color: TYPE_COLOR.private }}> ■ Private</span>
          </p>
        </div>
      </section>

      {/* ── WHAT'S ON CAMPUS Showcase ────────────────────────────────────── */}
      <section style={{ background: '#0a0a0a', padding: '64px 0 48px', overflow: 'hidden' }}>
        <div className="container" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#a78bfa', marginBottom: '10px' }}>
                CAMPUS MARKET
              </div>
              <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(32px, 5vw, 52px)', color: '#fff', lineHeight: 1, margin: 0 }}>
                WHAT&apos;S ON<br />
                <span style={{ color: '#a78bfa' }}>CAMPUS</span>
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/goods" style={{ padding: '10px 20px', border: '1px solid #444', color: '#ccc', fontSize: '12px', fontWeight: 700, textDecoration: 'none', letterSpacing: '1px', fontFamily: '"Space Grotesk", sans-serif' }}>
                GOODS
              </Link>
              <Link href="/services" style={{ padding: '10px 20px', background: '#a78bfa', color: '#111', fontSize: '12px', fontWeight: 700, textDecoration: 'none', letterSpacing: '1px', fontFamily: '"Archivo Black", sans-serif' }}>
                SERVICES
              </Link>
            </div>
          </div>
        </div>

        <div className="showcase-scroll">
          <div className="showcase-inner">
            {SHOWCASE.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="showcase-card showcase-item"
                style={{ textDecoration: 'none', display: 'block', position: 'relative', overflow: 'hidden', border: '2px solid #2a2a2a', cursor: 'pointer' }}
              >
                <img
                  src={item.img}
                  alt={item.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=560&fit=crop&q=80' }}
                  loading="lazy"
                />
                <div className="showcase-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.85))', transition: 'background 0.3s' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 12px 12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#a78bfa', marginBottom: '4px', fontFamily: '"Space Grotesk", sans-serif' }}>{item.tag}</div>
                  <div className="showcase-label" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', color: '#fff', lineHeight: 1.1, marginBottom: '2px' }}>{item.label}</div>
                  <div className="showcase-sublabel" style={{ fontSize: '11px', color: '#ccc', marginBottom: '6px' }}>{item.sublabel}</div>
                  <div className="showcase-arrow" style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, letterSpacing: '1px', fontFamily: '"Space Grotesk", sans-serif', opacity: 0, transform: 'translateX(-6px)', transition: 'all 0.25s' }}>
                    SHOP NOW →
                  </div>
                </div>
              </Link>
            ))}
            <Link
              href="/goods"
              className="showcase-end-card"
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '150px', flexShrink: 0, border: '2px dashed #333', color: '#666', gap: '12px' }}
            >
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', color: '#a78bfa' }}>+</div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', color: '#888', textAlign: 'center', lineHeight: 1.4 }}>200+<br />MORE ITEMS</div>
              <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, letterSpacing: '1px' }}>BROWSE ALL →</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Latest Goods ─────────────────────────────────────────────────── */}
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
          ) : goods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed #ddd' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', marginBottom: '8px' }}>NO LISTINGS YET</div>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>Be the first to list something on Campus Connect!</p>
              <Link href="/sell" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 28px' }}>LIST AN ITEM →</Link>
            </div>
          ) : (
            <div className="product-grid">
              {goods.map(good => <GoodsCard key={good.id} good={good} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Popular Services ──────────────────────────────────────────────── */}
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
          ) : services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed #ddd' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', marginBottom: '8px' }}>NO SERVICES YET</div>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>Have skills? Be the first to offer a campus service!</p>
              <Link href="/offer-service" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 28px' }}>OFFER A SERVICE →</Link>
            </div>
          ) : (
            <div className="product-grid">
              {services.map(service => <ServiceCard key={service.id} service={service} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '60px 20px', borderTop: '2px solid #111' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', marginBottom: '8px' }}>HOW IT WORKS</div>
            <p style={{ color: '#666', fontSize: '16px' }}>Three simple steps to buy, sell, or book on campus</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[
              { step: '01', title: 'Find Your Uni', desc: 'Select your university and browse your campus marketplace — only students from your school.', icon: '🎓' },
              { step: '02', title: 'List or Browse', desc: 'Post items for sale or find goods and services offered by fellow students near you.', icon: '📋' },
              { step: '03', title: 'Connect & Deal', desc: 'Message sellers directly, book services, and meet safely on campus. Zero fees.', icon: '🤝' },
            ].map(item => (
              <div key={item.step} className="how-card" style={{ border: '2px solid #111', padding: '32px', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
                <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', color: '#eee', lineHeight: 1 }}>{item.step}</div>
                <div style={{ fontSize: '32px', marginBottom: '12px', marginTop: '8px' }}>{item.icon}</div>
                <h3 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Strip ──────────────────────────────────────────────────── */}
      <section style={{ background: '#f8f8f8', padding: '48px 20px', borderTop: '2px solid #111' }}>
        <div className="container">
          <div className="trust-strip">
            {[
              { icon: '🔒', title: 'SAFE & VERIFIED', desc: 'All users are real students. Meet safely on campus.' },
              { icon: '💸', title: 'ZERO COMMISSION', desc: 'Keep 100% of what you earn. Always free.' },
              { icon: '⚡', title: 'INSTANT CONTACT', desc: 'Direct WhatsApp — no middlemen, no delays.' },
              { icon: '🇬🇭', title: '43 UNIVERSITIES', desc: 'Every accredited university in Ghana, one platform.' },
            ].map(item => (
              <div key={item.title} className="trust-item">
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', marginBottom: '3px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ background: '#1B5E20', padding: '60px 20px', textAlign: 'center', color: '#fff' }}>
        <div className="container">
          <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(28px, 5vw, 42px)', marginBottom: '16px', lineHeight: 1.1 }}>
            READY TO JOIN<br />YOUR CAMPUS?
          </h2>
          <p style={{ fontSize: '18px', maxWidth: '560px', margin: '0 auto 36px', color: 'rgba(255,255,255,0.8)' }}>
            Free forever. No commission. No hidden fees. Just pure campus community across all 43 Ghana universities.
          </p>
          <div className="cta-buttons" style={{ justifyContent: 'center' }}>
            <Link href="/auth/register" style={{
              display: 'inline-block', padding: '18px 48px',
              background: '#fff', color: '#1B5E20',
              fontFamily: '"Archivo Black", sans-serif', fontSize: '16px',
              textDecoration: 'none', border: '2px solid #fff',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
            }}>
              JOIN FREE
            </Link>
            <a href="#universities" style={{
              display: 'inline-block', padding: '18px 48px',
              background: 'transparent', color: '#fff',
              fontFamily: '"Archivo Black", sans-serif', fontSize: '16px',
              textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)',
            }}>
              FIND YOUR UNI
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
