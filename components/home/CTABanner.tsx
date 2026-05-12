import Link from 'next/link'
import SectionWrapper from '@/components/ui/SectionWrapper'

export default function CTABanner() {
  return (
    <>
      <style>{`
        .cta-btn-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        @media (max-width: 480px) {
          .cta-btn-row { flex-direction: column; align-items: center; }
          .cta-btn-row a { width: 100%; max-width: 280px; text-align: center; }
        }
      `}</style>
      <SectionWrapper className="bg-[#1B5E20] text-white text-center border-t-[2px] border-[#155a19]">
        <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: 'rgba(255,255,255,0.5)', marginBottom: '14px' }}>JOIN THE COMMUNITY</div>
        <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: 'clamp(26px, 5vw, 40px)', marginBottom: '14px', lineHeight: 1.1 }}>
          Ready to join<br />your campus?
        </h2>
        <p style={{ fontSize: '16px', maxWidth: '480px', margin: '0 auto 32px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Free forever. No commission. No hidden fees. Just pure campus community across all 43 Ghana universities.
        </p>
        <div className="cta-btn-row">
          <Link href="/auth/register" style={{ display: 'inline-block', padding: '16px 44px', background: '#fff', color: '#1B5E20', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '15px', textDecoration: 'none', borderRadius: '10px', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
            Join Free
          </Link>
          <a href="#universities" style={{ display: 'inline-block', padding: '16px 44px', background: 'transparent', color: '#fff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '15px', textDecoration: 'none', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.4)' }}>
            Find Your Uni
          </a>
        </div>
      </SectionWrapper>
    </>
  )
}
