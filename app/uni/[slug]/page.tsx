"use client"

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useParams } from 'next/navigation'
import { getUniversityBySlug } from '@/lib/ghana-universities'
import SectionWrapper from '@/components/ui/SectionWrapper'

export default function UniHomePage() {
  const params = useParams<{ slug: string }>()
  const uni = getUniversityBySlug(params.slug)
  if (!uni) notFound()

  return (
    <>
      {/* Hero */}
      <div style={{ background: '#111', color: '#fff', padding: '48px 20px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: uni.colors?.primary ?? '#1B5E20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Syne", sans-serif', fontSize: '20px', color: '#fff',
                border: '3px solid rgba(255,255,255,0.2)', flexShrink: 0,
              }}
            >
              {uni.shortName.slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: '#888', marginBottom: '6px' }}>
                {uni.city.toUpperCase()} · {uni.region.toUpperCase()} REGION
              </div>
              <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '40px', letterSpacing: '-1px', lineHeight: 1.05, marginBottom: '8px' }}>
                {uni.shortName}<br />
                <span style={{ fontSize: '18px', color: '#aaa', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 400, letterSpacing: 0 }}>
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
      <SectionWrapper className="bg-[#f8f8f8]">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {[
            {
              href: `/uni/${uni.slug}/goods`,
              label: 'BROWSE GOODS',
              desc: 'Buy and sell second-hand items — electronics, books, clothing and more.',
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5d3fd3" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
              accent: '#5d3fd3',
            },
            {
              href: `/uni/${uni.slug}/services`,
              label: 'FIND SERVICES',
              desc: 'Book student services — tutoring, barbing, laundry, photography and more.',
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
              accent: '#1B5E20',
            },
            {
              href: `/sell?uni=${uni.slug}`,
              label: 'SELL AN ITEM',
              desc: 'List something for sale. Reach every student at ' + uni.shortName + '.',
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff3366" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
              accent: '#ff3366',
            },
            {
              href: `/offer-service?uni=${uni.slug}`,
              label: 'OFFER A SERVICE',
              desc: 'Got skills? List your service and start earning on campus.',
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
              accent: '#b45309',
              dark: false,
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
                <div style={{ marginBottom: '14px' }}>{card.icon}</div>
                <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', marginBottom: '8px', color: '#111' }}>
                  {card.label}
                </div>
                <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, margin: 0 }}>
                  {card.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </SectionWrapper>
    </>
  )
}
