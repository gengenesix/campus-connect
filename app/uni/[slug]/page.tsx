"use client"

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useParams } from 'next/navigation'
import { getUniversityBySlug } from '@/lib/ghana-universities'

export default function UniHomePage() {
  const params = useParams<{ slug: string }>()
  const uni = getUniversityBySlug(params.slug)
  if (!uni) notFound()

  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{ background: '#111', color: '#fff', padding: '48px 20px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: uni.colors?.primary ?? '#1B5E20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', color: '#fff',
                border: '3px solid rgba(255,255,255,0.2)', flexShrink: 0,
              }}
            >
              {uni.shortName.slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: '#888', marginBottom: '6px' }}>
                {uni.city.toUpperCase()} · {uni.region.toUpperCase()} REGION
              </div>
              <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '40px', letterSpacing: '-1px', lineHeight: 1.05, marginBottom: '8px' }}>
                {uni.shortName}<br />
                <span style={{ fontSize: '18px', color: '#aaa', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 400, letterSpacing: 0 }}>
                  {uni.name}
                </span>
              </h1>
              <p style={{ color: '#888', fontSize: '14px' }}>
                Student marketplace · Buy, sell & book services on campus
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav cards */}
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {[
            {
              href: `/uni/${uni.slug}/goods`,
              label: 'BROWSE GOODS',
              desc: 'Buy and sell second-hand items — electronics, books, clothing and more.',
              icon: '📦',
              accent: '#5d3fd3',
            },
            {
              href: `/uni/${uni.slug}/services`,
              label: 'FIND SERVICES',
              desc: 'Book student services — tutoring, barbing, laundry, photography and more.',
              icon: '🛠️',
              accent: '#1B5E20',
            },
            {
              href: `/sell?uni=${uni.slug}`,
              label: 'SELL AN ITEM',
              desc: 'List something for sale. Reach every student at ' + uni.shortName + '.',
              icon: '💰',
              accent: '#ff3366',
            },
            {
              href: `/offer-service?uni=${uni.slug}`,
              label: 'OFFER A SERVICE',
              desc: 'Got skills? List your service and start earning on campus.',
              icon: '⚡',
              accent: '#ccff00',
              dark: true,
            },
          ].map(card => (
            <Link
              key={card.href}
              href={card.href}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  border: '2px solid #111',
                  background: '#fff',
                  padding: '28px 24px',
                  boxShadow: '4px 4px 0 #111',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  cursor: 'pointer',
                  borderTop: `4px solid ${card.accent}`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translate(-2px, -2px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #111'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'none'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #111'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{card.icon}</div>
                <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', marginBottom: '8px', color: '#111' }}>
                  {card.label}
                </div>
                <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, margin: 0 }}>
                  {card.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
