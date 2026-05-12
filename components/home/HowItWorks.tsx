import React from 'react'
import SectionWrapper from '@/components/ui/SectionWrapper'

const STEPS = [
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
]

export default function HowItWorks() {
  return (
    <>
      <style>{`
        .how-card:hover { transform: translate(-3px, -3px); box-shadow: 7px 7px 0 #111 !important; }
        .how-card { transition: all 0.2s; }
        /* Mobile: horizontal scroll strip */
        .how-scroll { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; margin: 0 -16px; padding: 0 16px 4px; }
        .how-scroll::-webkit-scrollbar { display: none; }
        .how-inner { display: flex; gap: 16px; width: max-content; }
        .how-inner .how-card { min-width: 280px; flex-shrink: 0; }
        /* Desktop: 3-col grid */
        @media (min-width: 769px) {
          .how-scroll { overflow-x: visible; margin: 0; padding: 0; }
          .how-inner { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; width: auto; }
          .how-inner .how-card { min-width: unset; flex-shrink: unset; }
        }
      `}</style>

      <SectionWrapper className="border-t border-[#E8E5E0]">
        <div className="text-center mb-12">
          <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#9A9590', marginBottom: '10px' }}>SIMPLE PROCESS</div>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: 'clamp(24px, 4vw, 36px)', marginBottom: '8px', color: '#1A1A1A', letterSpacing: '-0.5px' }}>How It Works</div>
          <p style={{ color: '#6B6660', fontSize: '15px', margin: 0, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Three simple steps to buy, sell, or book on campus</p>
        </div>

        <div className="how-scroll">
          <div className="how-inner">
            {STEPS.map(item => (
              <div key={item.step} className="how-card" style={{ border: '1px solid #E8E5E0', borderTop: `3px solid ${item.accent}`, padding: '28px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', background: '#fff', borderRadius: '0 0 14px 14px' }}>
                <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '44px', color: '#F3F2EF', lineHeight: 1, marginBottom: '4px' }}>{item.step}</div>
                <div style={{ marginBottom: '14px' }}>{item.icon}</div>
                <h3 style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', marginBottom: '8px', color: '#1A1A1A' }}>{item.title}</h3>
                <p style={{ color: '#6B6660', fontSize: '14px', lineHeight: 1.65, margin: 0, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
