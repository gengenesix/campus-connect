import React from 'react'
import SectionWrapper from '@/components/ui/SectionWrapper'

const FEATURES = [
  {
    title: 'Safe & Verified', desc: 'All users are real students. Meet safely on campus.', color: '#1B5E20', tint: '#E8F5E9',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    title: 'Zero Commission', desc: 'Keep 100% of what you earn. Always free for buyers.', color: '#5d3fd3', tint: '#EDE9FE',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5d3fd3" strokeWidth="2" strokeLinecap="round">
        <line x1="19" y1="5" x2="5" y2="19" />
        <circle cx="6.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </svg>
    ),
  },
  {
    title: 'Instant Contact', desc: 'Direct WhatsApp — no middlemen, no delays.', color: '#ff3366', tint: '#FFE4EC',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff3366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: '43 Universities', desc: 'Every accredited university in Ghana, one platform.', color: '#B45309', tint: '#FEF3C7',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        .trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .trust-card {
          background: #fff; border: 1px solid #E8E5E0; border-radius: 14px;
          padding: 24px 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        .trust-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.10); }
        @media (max-width: 768px) { .trust-grid { grid-template-columns: 1fr 1fr !important; gap: 14px !important; } }
        @media (min-width: 769px) and (max-width: 1024px) { .trust-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>

      <SectionWrapper className="border-t border-[#E8E5E0]">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#9A9590', marginBottom: '10px' }}>WHY CAMPUS CONNECT</div>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: 'clamp(24px, 4vw, 36px)', color: '#1A1A1A', letterSpacing: '-0.5px' }}>Built for students, by students</div>
        </div>
        <div className="trust-grid">
          {FEATURES.map(item => (
            <div key={item.title} className="trust-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: item.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                {item.icon}
              </div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '15px', marginBottom: '6px', color: '#1A1A1A' }}>{item.title}</div>
              <div style={{ fontSize: '13px', color: '#6B6660', lineHeight: 1.6, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </>
  )
}
