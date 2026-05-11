import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createSupabaseReadClient } from '@/lib/supabase-server'
import ServiceActionsClient from './ServiceActionsClient'
import ImageGallery from '@/components/ImageGallery'
import ReviewsSection from '@/components/ReviewsSection'

export const revalidate = 60

type Params = Promise<{ id: string }>

interface Service {
  id: string
  name: string
  category: string
  rate: string | null
  availability: string | null
  response_time: string | null
  image_url: string | null
  description: string
  total_bookings: number
  whatsapp: string | null
  provider: {
    id: string
    name: string
    avatar_url: string | null
    rating: number
    phone: string | null
  } | null
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params
  const supabase = createSupabaseReadClient()
  const { data } = await supabase
    .from('services')
    .select('name, description, image_url, rate')
    .eq('id', id)
    .neq('status', 'deleted')
    .single()

  if (!data) return { title: 'Service Not Found — Campus Connect' }

  return {
    title: `${data.name} — Campus Connect`,
    description: (data.description ?? `Book ${data.name} on Campus Connect Ghana`).slice(0, 155),
    openGraph: {
      title: data.name,
      description: (data.description ?? '').slice(0, 155),
      images: data.image_url ? [{ url: data.image_url }] : [],
    },
  }
}

export default async function ServiceDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = createSupabaseReadClient()

  const { data, error } = await supabase
    .from('services')
    .select(`
      id, name, category, rate, availability, response_time, image_url, description, total_bookings, whatsapp,
      provider:profiles!provider_id (id, name, avatar_url, rating, phone)
    `)
    .eq('id', id)
    .neq('status', 'deleted')
    .single()

  if (error || !data) notFound()

  const service = data as unknown as Service

  const { data: serviceImagesData } = await supabase
    .from('service_images')
    .select('image_url')
    .eq('service_id', id)
    .order('display_order', { ascending: true })

  const galleryImages = [
    ...(service.image_url ? [{ url: service.image_url, alt: service.name }] : []),
    ...((serviceImagesData ?? []) as { image_url: string }[]).map(img => ({ url: img.image_url, alt: service.name })),
  ]

  const { data: relatedData } = await supabase
    .from('services')
    .select('id, name, rate, image_url')
    .eq('category', service.category)
    .neq('id', id)
    .neq('status', 'deleted')
    .limit(3)

  const related = (relatedData ?? []) as { id: string; name: string; rate: string | null; image_url: string | null }[]

  const rawContact = service.whatsapp || service.provider?.phone || ''

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    image: galleryImages.map(g => g.url).filter(Boolean),
    provider: {
      '@type': 'Person',
      name: service.provider?.name ?? 'Campus Provider',
    },
    ...(service.rate ? { offers: { '@type': 'Offer', price: service.rate, priceCurrency: 'GHS' } } : {}),
    ...(service.provider?.rating && service.provider.rating > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: service.provider.rating,
        ratingCount: 1,
        bestRating: 5,
      },
    } : {}),
  }
  const whatsappMsg = `Hi ${service.provider?.name ?? ''}, I'd like to book: ${service.name} on Campus Connect`
  const whatsappHref = rawContact
    ? `https://wa.me/${rawContact.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`

  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div style={{ background: '#111', padding: '12px 20px' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#666' }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/services" style={{ color: '#666', textDecoration: 'none' }}>Services</Link>
          <span>›</span>
          <span style={{ color: '#86efac' }}>{service.name}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '48px', alignItems: 'start' }}>

          {/* LEFT — Image + Stats */}
          <div>
            <ImageGallery images={galleryImages} alt={service.name} height={400} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 14px', background: '#1B5E20', color: '#fff', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #111' }}>
                {service.category.toUpperCase()}
              </span>
              {service.response_time && (
                <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #ddd', color: '#888', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {service.response_time}
                </span>
              )}
              <span style={{ padding: '6px 14px', background: '#fff', fontWeight: 600, fontSize: '11px', border: '2px solid #ddd', color: '#888', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {service.total_bookings} bookings
              </span>
            </div>

            {service.availability && (
              <div style={{ marginTop: '20px', border: '2px solid #1B5E20', padding: '16px', background: '#e8f5e9' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#1B5E20', marginBottom: '6px' }}>AVAILABILITY</div>
                <div style={{ fontWeight: 700, color: '#1B5E20', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {service.availability}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Info */}
          <div>
            <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '30px', lineHeight: 1.1, marginBottom: '16px', color: '#111', letterSpacing: '-0.5px' }}>
              {service.name}
            </h1>

            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '40px', color: '#1B5E20', marginBottom: '6px', lineHeight: 1 }}>
              {service.rate ?? 'Contact for pricing'}
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Pricing may vary by request</div>

            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#444', marginBottom: '28px', paddingLeft: '16px', borderLeft: '4px solid #1B5E20' }}>
              {service.description}
            </p>

            {/* Provider Card */}
            <div style={{ border: '2px solid #111', padding: '20px', background: '#fff', marginBottom: '20px', boxShadow: '4px 4px 0 #111' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '12px', color: '#888' }}>SERVICE PROVIDER</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {service.provider?.avatar_url ? (
                  <Image
                    src={service.provider.avatar_url}
                    alt={service.provider.name}
                    width={52} height={52}
                    style={{ borderRadius: '50%', border: '2px solid #111', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', border: '2px solid #111' }}>
                    {(service.provider?.name ?? 'P').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>{service.provider?.name ?? 'Provider'}</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {service.provider?.rating
                        ? (<><svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> {service.provider.rating.toFixed(1)}/5</>)
                        : (<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> New provider</>)
                      }
                    </span>{' '}· Campus Provider
                  </div>
                  {service.provider?.id && (
                    <Link
                      href={`/profile/${service.provider.id}`}
                      style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', fontWeight: 700, color: '#1B5E20', textDecoration: 'none', letterSpacing: '0.5px', borderBottom: '1px solid #1B5E20' }}
                    >
                      VIEW PROFILE →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive actions (client-rendered) */}
            <ServiceActionsClient
              serviceId={service.id}
              serviceName={service.name}
              providerId={service.provider?.id ?? null}
              whatsappHref={whatsappHref}
            />

            <div style={{ padding: '14px 16px', background: '#e8f5e9', border: '2px solid #1B5E20', fontSize: '13px', color: '#1B5E20', lineHeight: 1.5 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <strong>Active provider:</strong> {service.response_time ? `Response time is ${service.response_time}.` : ''} This provider is active on campus.
              </span>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {service.provider?.id && (
          <ReviewsSection serviceId={service.id} revieweeId={service.provider.id} />
        )}

        {/* Related Services */}
        {related.length > 0 && (
          <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid #111' }}>
            <div className="trending-header" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '22px', textTransform: 'uppercase' }}>
                More {service.category} Services
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {related.map(s => (
                <Link key={s.id} href={`/services/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ border: '2px solid #eee', background: '#fff', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                      <Image src={s.image_url ?? '/placeholder.jpg'} alt={s.name} fill style={{ objectFit: 'cover' }} sizes="33vw" />
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{s.name}</div>
                      <div style={{ fontFamily: '"Archivo Black"', fontSize: '16px', color: '#1B5E20' }}>{s.rate ?? 'Contact for pricing'}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
