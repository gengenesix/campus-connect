import Link from 'next/link'
import SectionWrapper from '@/components/ui/SectionWrapper'

export default function CTABanner() {
  return (
    <SectionWrapper className="bg-[#1B5E20] text-white text-center border-t-[3px] border-[#111]">
      <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: 'rgba(255,255,255,0.55)', marginBottom: '16px' }}>JOIN THE COMMUNITY</div>
      <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(28px, 5vw, 42px)', marginBottom: '16px', lineHeight: 1.1 }}>
        READY TO JOIN<br />YOUR CAMPUS?
      </h2>
      <p style={{ fontSize: '17px', maxWidth: '500px', margin: '0 auto 36px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.65 }}>
        Free forever. No commission. No hidden fees. Just pure campus community across all 43 Ghana universities.
      </p>
      <div className="cta-buttons" style={{ justifyContent: 'center' }}>
        <Link href="/auth/register" style={{ display: 'inline-block', padding: '18px 48px', background: '#fff', color: '#1B5E20', fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', textDecoration: 'none', border: '2px solid #fff', boxShadow: '4px 4px 0 rgba(0,0,0,0.25)' }}>
          JOIN FREE
        </Link>
        <a href="#universities" style={{ display: 'inline-block', padding: '18px 48px', background: 'transparent', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)' }}>
          FIND YOUR UNI
        </a>
      </div>
    </SectionWrapper>
  )
}
