import Link from 'next/link'
import SectionWrapper from '@/components/ui/SectionWrapper'

const SHOWCASE = [
  { label: 'BRAIDS', sublabel: 'Box braids, cornrows & locs', href: '/services', img: '/images/showcase/braids.jpg', tag: 'HAIR' },
  { label: 'NAIL ART', sublabel: 'Gel, acrylic & nail designs', href: '/services', img: '/images/showcase/nails.jpg', tag: 'BEAUTY' },
  { label: 'BARBER', sublabel: 'Fades, cuts & styling', href: '/services', img: '/images/showcase/barber.jpg', tag: 'GROOMING' },
  { label: 'CAMPUS FOOD', sublabel: 'Rice, stew & local dishes', href: '/goods', img: '/images/showcase/food.jpg', tag: 'FOOD' },
  { label: 'SOBOLO', sublabel: 'Cold & refreshing hibiscus drink', href: '/goods', img: '/images/showcase/sobolo.jpg', tag: 'FOOD & DRINK' },
  { label: 'LOCAL DRINKS', sublabel: 'Brukina, yoghurt & more', href: '/goods', img: '/images/showcase/drinks.jpg', tag: 'FOOD & DRINK' },
  { label: 'MILKSHAKES', sublabel: 'Cold blends & smoothies', href: '/goods', img: '/images/showcase/milkshakes.jpg', tag: 'FOOD & DRINK' },
  { label: 'PHONES & GADGETS', sublabel: 'Earbuds, cases & accessories', href: '/goods', img: '/images/showcase/phones.jpg', tag: 'ELECTRONICS' },
  { label: 'CALCULATORS', sublabel: 'Casio, Sharp & scientific', href: '/goods', img: '/images/showcase/calculator.jpg', tag: 'ACADEMICS' },
  { label: 'MAKEUPS', sublabel: 'Lip gloss, skincare & more', href: '/goods', img: '/images/showcase/lipcombo.jpg', tag: 'BEAUTY' },
  { label: 'BAGS', sublabel: 'Handbags, totes & clutches', href: '/goods', img: '/images/showcase/bags.jpg', tag: 'FASHION' },
  { label: 'PERFUMES', sublabel: 'Arabic, designer & local scents', href: '/goods', img: '/images/showcase/perfumes.jpg', tag: 'BEAUTY' },
  { label: 'JEWELLERY', sublabel: 'Bracelets, rings & necklaces', href: '/goods', img: '/images/showcase/jewelry.jpg', tag: 'FASHION' },
  { label: 'DELIVERY', sublabel: 'Fast campus delivery services', href: '/services', img: '/images/showcase/delivery.jpg', tag: 'SERVICE' },
  { label: 'TEXTBOOKS', sublabel: 'All subjects & levels', href: '/goods', img: '/images/showcase/textbooks.jpg', tag: 'ACADEMICS' },
]

export default function CategoryGrid() {
  return (
    <>
      <style>{`
        .showcase-card:hover .showcase-overlay { background: linear-gradient(transparent 10%, rgba(0,0,0,0.94)) !important; }
        .showcase-card:hover img { transform: scale(1.07); }
        .showcase-card img { transition: transform 0.5s ease; }
        .showcase-card:hover .showcase-arrow { opacity: 1 !important; transform: translateX(0) !important; }
        .showcase-scroll {
          overflow-x: auto;
          padding-left: max(20px, calc((100vw - 1240px) / 2));
          padding-right: 20px; padding-bottom: 16px;
          scrollbar-width: thin; scrollbar-color: #5d3fd3 #222;
        }
        .showcase-inner { display: flex; gap: 14px; width: max-content; }
        .showcase-item { width: 210px; height: 310px; flex-shrink: 0; }
        .showcase-end-card { display: flex; }
        @media (max-width: 768px) {
          .showcase-scroll { overflow-x: visible; padding-left: 16px; padding-right: 16px; padding-bottom: 0; }
          .showcase-inner { display: grid; grid-template-columns: 1fr 1fr; width: 100%; gap: 10px; }
          .showcase-item { width: 100%; height: 180px; }
          .showcase-end-card { display: none; }
          .showcase-label { font-size: 15px !important; }
          .showcase-sublabel { display: none; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .showcase-item { width: 175px; height: 260px; }
        }
      `}</style>

      <SectionWrapper dark fullBleed className="overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#a78bfa', marginBottom: '10px' }}>
                CAMPUS MARKET
              </div>
              <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: 'clamp(32px, 5vw, 52px)', color: '#fff', lineHeight: 1, margin: 0 }}>
                WHAT&apos;S ON<br /><span style={{ color: '#a78bfa' }}>CAMPUS</span>
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/goods" style={{ padding: '10px 22px', border: '1px solid #333', color: '#aaa', fontSize: '12px', fontWeight: 700, textDecoration: 'none', letterSpacing: '1px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                BROWSE GOODS
              </Link>
              <Link href="/services" style={{ padding: '10px 22px', background: '#5d3fd3', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', letterSpacing: '1px', fontFamily: '"Syne", sans-serif', border: '1px solid #5d3fd3' }}>
                BOOK SERVICES
              </Link>
            </div>
          </div>
        </div>
        <div className="showcase-scroll">
          <div className="showcase-inner">
            {SHOWCASE.map(item => (
              <Link key={item.label} href={item.href} className="showcase-card showcase-item" style={{ textDecoration: 'none', display: 'block', position: 'relative', overflow: 'hidden', border: '2px solid #2a2a2a', cursor: 'pointer' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.img} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg' }} loading="lazy" />
                <div className="showcase-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.85))', transition: 'background 0.3s' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 12px 12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#a78bfa', marginBottom: '4px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{item.tag}</div>
                  <div className="showcase-label" style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', color: '#fff', lineHeight: 1.1, marginBottom: '2px' }}>{item.label}</div>
                  <div className="showcase-sublabel" style={{ fontSize: '11px', color: '#ccc', marginBottom: '6px' }}>{item.sublabel}</div>
                  <div className="showcase-arrow" style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, letterSpacing: '1px', fontFamily: '"Plus Jakarta Sans", sans-serif', opacity: 0, transform: 'translateX(-6px)', transition: 'all 0.25s' }}>SHOP NOW →</div>
                </div>
              </Link>
            ))}
            <Link href="/goods" className="showcase-end-card" style={{ textDecoration: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '150px', flexShrink: 0, border: '2px dashed #333', color: '#666', gap: '12px' }}>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '36px', color: '#5d3fd3' }}>+</div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '13px', color: '#888', textAlign: 'center', lineHeight: 1.4 }}>200+<br />MORE ITEMS</div>
              <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, letterSpacing: '1px' }}>BROWSE ALL →</div>
            </Link>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
