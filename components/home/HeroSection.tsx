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
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
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

        {/* RIGHT — original overlapping collage */}
        <div className="hero-visuals">
          <div className="abstract-shape">
            <svg width="520" height="520" viewBox="0 0 520 520" fill="none">
              <circle cx="260" cy="260" r="250" fill="#1B5E20" opacity="0.07" />
              <circle cx="260" cy="260" r="195" fill="#1B5E20" opacity="0.05" />
            </svg>
          </div>
          <div className="decorative-star">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
              <path d="M36 2 L43 26 L68 26 L48 41 L55 65 L36 51 L17 65 L24 41 L4 26 L29 26 Z" fill="#1B5E20" opacity="0.85" />
            </svg>
          </div>
          <div className="main-image-container">
            <img src="/images/hero/main.jpg" alt="Campus marketplace" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg' }} />
            <div style={{
              position: 'absolute', top: '20px', left: '-14px',
              background: '#ff3366', color: '#fff',
              fontFamily: '"Archivo Black", sans-serif', fontSize: '11px',
              letterSpacing: '2px', padding: '7px 16px',
              border: '2px solid #111', boxShadow: '3px 3px 0 #111',
            }}>
              LIVE
            </div>
          </div>
          <div className="secondary-image">
            <img src="/images/hero/secondary.jpg" alt="Student services" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg' }} />
          </div>
          <div className="sticker-graphic">
            <div className="hot-badge" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '10px', letterSpacing: '0.5px' }}>
              FREE
            </div>
            <img src="/images/hero/sticker.jpg" alt="Campus student" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg' }} />
          </div>
        </div>
      </section>

      {/* TICKER */}
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
    </>
  )
}
