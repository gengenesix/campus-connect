"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TICKER_ITEMS = [
  '43 UNIVERSITIES', 'BRAIDS', 'NAIL ART', 'BARBER', 'CAMPUS FOOD', 'SOBOLO',
  'LOCAL DRINKS', 'MILKSHAKES', 'PHONES & GADGETS', 'CALCULATORS', 'MAKEUPS',
  'BAGS', 'PERFUMES', 'JEWELLERY', 'DELIVERY', 'TEXTBOOKS', 'LAUNDRY', 'TUTORING',
  'TECH REPAIR', 'PHOTOGRAPHY', 'DESIGN',
]

const STATS = [
  { num: '43',   label: 'Universities' },
  { num: '0%',   label: 'Commission' },
  { num: 'Free', label: 'Forever' },
  { num: 'P2P',  label: 'Direct Deals' },
]

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const tickerSet = [...TICKER_ITEMS, ...TICKER_ITEMS]

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) router.push(`/goods?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="season-badge">
            Ghana's Campus Marketplace · 43 Universities
          </div>
          <h1 className="hero-headline">
            BUY, SELL
            <br />
            &amp; <span className="hero-headline-highlight">CONNECT</span>
          </h1>
          <p className="hero-subtext">
            The free peer-to-peer marketplace for students across all Ghanaian universities.
            Buy goods, book campus services, connect with fellow students.
            Zero commission. Zero fees.
          </p>
          <div className="cta-buttons">
            <a href="#universities" className="btn-primary hover-lift" style={{ textDecoration: 'none' }}>
              Find Your Uni →
            </a>
            <Link href="/goods" className="btn-secondary hover-lift">
              Browse Goods
            </Link>
          </div>

          <form onSubmit={handleHeroSearch} className="hero-search-form">
            <input
              type="text"
              placeholder="Search goods & services across all unis..."
              className="hero-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="hero-search-btn">Search</button>
          </form>

          {/* Stats strip — inline, warm background, no dark bar */}
          <div className="hero-stats-strip">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="hero-stat-num">{s.num}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="social-proof">
            <div className="avatar-stack">
              <img src="/images/hero/avatar1.jpg" alt="Student" onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-user.jpg' }} />
              <img src="/images/hero/avatar2.jpg" alt="Student" onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-user.jpg' }} />
              <img src="/images/hero/avatar3.jpg" alt="Student" onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-user.jpg' }} />
            </div>
            <div>
              <div className="social-proof-title">Ghana Campus Community</div>
              <div className="social-proof-subtitle">Students across 43 universities buying &amp; selling</div>
            </div>
          </div>
        </div>

        {/* RIGHT — overlapping collage */}
        <div className="hero-visuals">
          <div className="abstract-shape">
            <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
              <circle cx="250" cy="250" r="240" fill="#1B5E20" opacity="0.06" />
              <circle cx="250" cy="250" r="185" fill="#1B5E20" opacity="0.04" />
            </svg>
          </div>
          <div className="decorative-star">
            <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
              <path d="M36 2 L43 26 L68 26 L48 41 L55 65 L36 51 L17 65 L24 41 L4 26 L29 26 Z" fill="#1B5E20" opacity="0.75" />
            </svg>
          </div>
          <div className="main-image-container">
            <img src="/images/hero/main.jpg" alt="Campus marketplace" onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg' }} />
            <div style={{
              position: 'absolute', top: '18px', left: '-12px',
              background: '#ff3366', color: '#fff',
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '10px',
              letterSpacing: '1.5px', padding: '6px 14px',
              border: '2px solid #1A1A1A', boxShadow: '3px 3px 0 #1A1A1A',
              borderRadius: '4px',
            }}>
              LIVE
            </div>
          </div>
          <div className="secondary-image">
            <img src="/images/hero/secondary.jpg" alt="Student services" onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg' }} />
          </div>
          <div className="sticker-graphic">
            <div className="hot-badge" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '10px', letterSpacing: '0.3px' }}>
              FREE
            </div>
            <img src="/images/hero/sticker.jpg" alt="Campus student" onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg' }} />
          </div>
        </div>
      </section>

      {/* TICKER — softer, keeping #ccff00 signature */}
      <div style={{
        background: '#1A1A1A',
        borderTop: '1px solid #2a2a2a',
        borderBottom: '1px solid #2a2a2a',
        padding: '10px 0', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', animation: 'ticker 32s linear infinite', width: 'max-content' }}>
          {tickerSet.map((item, i) => (
            <span key={i} style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700, fontSize: '11px',
              color: '#fff', whiteSpace: 'nowrap', padding: '0 18px',
              letterSpacing: '0.8px',
            }}>
              {item}
              <span style={{ color: '#ccff00', marginLeft: '18px', fontWeight: 900 }}>·</span>
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
