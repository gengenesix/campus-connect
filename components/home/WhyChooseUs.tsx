import React from 'react'
import SectionWrapper from '@/components/ui/SectionWrapper'

const FEATURES = [
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
]

export default function WhyChooseUs() {
  return (
    <>
      <style>{`
        .trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
        @media (max-width: 768px) { .trust-grid { grid-template-columns: 1fr 1fr !important; gap: 20px !important; } }
        @media (min-width: 769px) and (max-width: 1024px) { .trust-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>

      <SectionWrapper dark className="border-t border-[#1a1a1a]">
        <div className="trust-grid">
          {FEATURES.map(item => (
            <div key={item.title} style={{ borderLeft: `3px solid ${item.accent}`, paddingLeft: '20px' }}>
              <span style={{ display: 'block', marginBottom: '12px' }}>{item.icon}</span>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '13px', marginBottom: '6px', color: '#fff', letterSpacing: '0.5px' }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.55 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </>
  )
}
