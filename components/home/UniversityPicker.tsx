"use client"

import { useState } from 'react'
import Link from 'next/link'
import { GHANA_UNIVERSITIES, type UniversityType } from '@/lib/ghana-universities'
import SectionWrapper from '@/components/ui/SectionWrapper'

const TYPE_COLOR: Record<UniversityType, string> = {
  public: '#1B5E20',
  technical: '#5d3fd3',
  private: '#b45309',
}

const INITIAL_UNI_COUNT = 8

export default function UniversityPicker() {
  const [uniSearch, setUniSearch] = useState('')
  const [uniType, setUniType] = useState<'' | UniversityType>('')
  const [showAllUnis, setShowAllUnis] = useState(false)

  const filteredUnis = GHANA_UNIVERSITIES.filter(u => {
    const matchesType = !uniType || u.type === uniType
    const q = uniSearch.toLowerCase()
    const matchesSearch = !q || u.shortName.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q)
    return matchesType && matchesSearch
  })

  const isFiltering = uniSearch.trim() !== '' || uniType !== ''
  const displayedUnis = (isFiltering || showAllUnis) ? filteredUnis : filteredUnis.slice(0, INITIAL_UNI_COUNT)
  const hasMoreUnis = !isFiltering && !showAllUnis && filteredUnis.length > INITIAL_UNI_COUNT

  return (
    <>
      <style>{`
        .uni-card { transition: transform 0.15s, box-shadow 0.15s; cursor: pointer; }
        .uni-card:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 #111 !important; }
        .uni-expand-btn {
          padding: 12px 32px; border: 2px solid #111; background: #fff;
          font-family: "Syne", sans-serif; font-size: 12px;
          letter-spacing: 1px; cursor: pointer; box-shadow: 3px 3px 0 #111; transition: all 0.15s;
        }
        .uni-expand-btn:hover { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 #111; }
        .uni-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 768px) { .uni-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 769px) and (max-width: 1024px) { .uni-grid { grid-template-columns: repeat(3, 1fr) !important; } }
      `}</style>

      <SectionWrapper id="universities" className="border-b-2 border-[#111]">
        {/* Header */}
        <div className="text-center mb-12">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#1B5E20', color: '#fff', padding: '6px 16px',
            fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px',
            fontWeight: 700, letterSpacing: '2px', marginBottom: '20px',
            border: '1.5px solid #111',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="9" width="18" height="12" /><path d="M3 9l9-6 9 6" /><path d="M9 21V12h6v9" />
            </svg>
            EVERY ACCREDITED UNIVERSITY IN GHANA
          </div>
          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 0.95, margin: 0, letterSpacing: '-1px' }}>
            FIND YOUR<br /><span style={{ color: '#1B5E20' }}>CAMPUS</span>
          </h2>
          <p style={{ color: '#666', fontSize: '16px', marginTop: '16px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Campus Connect serves all 43 accredited universities in Ghana — public, technical, and private.
          </p>
        </div>

        {/* Search bar */}
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
                fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
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
                  fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px',
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

        {/* University grid — compact cards, max-height 96px */}
        <div className="uni-grid">
          {displayedUnis.map(uni => (
            <Link key={uni.slug} href={`/uni/${uni.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="uni-card" style={{
                border: '2px solid #e8e8e8', borderTop: `3px solid ${TYPE_COLOR[uni.type]}`,
                background: '#fff', padding: '12px 14px',
                maxHeight: '96px', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '9px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, letterSpacing: '1.5px', color: TYPE_COLOR[uni.type], marginBottom: '4px', textTransform: 'uppercase' }}>
                    {uni.type}
                  </div>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '17px', lineHeight: 1, color: '#111', letterSpacing: '-0.5px', marginBottom: '3px' }}>
                    {uni.shortName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#777', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                    {uni.city}
                  </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" style={{ alignSelf: 'flex-end' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {filteredUnis.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#888', border: '2px dashed #ddd', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '16px', marginBottom: '6px' }}>NO MATCH FOUND</div>
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
          {!isFiltering && showAllUnis && filteredUnis.length > INITIAL_UNI_COUNT && (
            <button className="uni-expand-btn" onClick={() => { setShowAllUnis(false); setTimeout(() => document.getElementById('universities')?.scrollIntoView({ behavior: 'smooth' }), 50) }}>
              SHOW LESS ↑
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {(['public', 'technical', 'private'] as UniversityType[]).map(t => (
            <span key={t} style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', background: TYPE_COLOR[t], display: 'inline-block' }} />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          ))}
        </div>
      </SectionWrapper>
    </>
  )
}
