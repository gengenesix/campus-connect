"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GoodsCard from '@/components/GoodsCard'
import ServiceCard from '@/components/ServiceCard'
import type { Good, Service } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'
import SectionWrapper from '@/components/ui/SectionWrapper'
import HeroSection from '@/components/home/HeroSection'
import UniversityPicker from '@/components/home/UniversityPicker'
import CategoryGrid from '@/components/home/CategoryGrid'
import HowItWorks from '@/components/home/HowItWorks'
import WhyChooseUs from '@/components/home/WhyChooseUs'
import CTABanner from '@/components/home/CTABanner'

export default function HomePage() {
  const [goods, setGoods] = useState<Good[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      const res = await fetch('/api/featured')
      if (!res.ok) { setLoadingData(false); return }
      const { goods: productsData, services: servicesData } = await res.json()
      setGoods(
        (productsData ?? []).map((p: any) => ({
          id: p.id, name: p.title, price: p.price, condition: p.condition,
          category: p.category ?? 'Other', seller: p.seller?.name ?? 'Student',
          sellerId: p.seller_id, sellerImage: p.seller?.avatar_url ?? '/placeholder-user.jpg',
          sellerRating: p.seller?.rating ?? 0, sellerVerified: p.seller?.is_verified ?? false,
          image: p.image_url ?? '/placeholder.jpg', description: p.description ?? '',
          createdAt: timeAgo(p.created_at), views: p.views ?? 0,
        }))
      )
      setServices(
        (servicesData ?? []).map((s: any) => ({
          id: s.id, name: s.name, provider: s.provider?.name ?? 'Student',
          providerId: s.provider_id, providerImage: s.provider?.avatar_url ?? '/placeholder-user.jpg',
          providerRating: s.provider?.rating ?? 0, providerVerified: s.provider?.is_verified ?? false,
          category: s.category, rate: s.rate ?? 'Contact for pricing',
          description: s.description ?? '', availability: s.availability ?? 'Contact provider',
          image: s.image_url ?? '/placeholder.jpg', responseTime: s.response_time ?? 'Varies',
          bookings: s.total_bookings ?? 0,
        }))
      )
      setLoadingData(false)
    }
    fetchFeatured()
  }, [])

  const showGoods = loadingData || goods.length > 0
  const showServices = loadingData || services.length > 0

  return (
    <>
      <HeroSection />
      <UniversityPicker />
      <CategoryGrid />

      {/* LATEST GOODS */}
      {showGoods && (
        <SectionWrapper id="featured" className="border-t-2 border-[#111]">
          <div className="trending-header">
            <h3>Latest Goods</h3>
            <Link href="/goods">See All →</Link>
          </div>
          {loadingData ? (
            <div className="product-grid">
              {[1,2,3,4].map(i => (
                <div key={i} style={{ border: '2px solid #eee', overflow: 'hidden' }}>
                  <div className="skeleton" style={{ height: '220px' }} />
                  <div style={{ padding: '14px 16px 16px' }}>
                    <div className="skeleton" style={{ height: '16px', marginBottom: '10px', width: '85%' }} />
                    <div className="skeleton" style={{ height: '12px', width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {goods.map(good => <GoodsCard key={good.id} good={good} />)}
            </div>
          )}
        </SectionWrapper>
      )}

      {/* POPULAR SERVICES */}
      {showServices && (
        <SectionWrapper className="bg-[#f5f5f5] border-t-2 border-[#111]">
          <div className="trending-header">
            <h3>Popular Services</h3>
            <Link href="/services">See All →</Link>
          </div>
          {loadingData ? (
            <div className="product-grid">
              {[1,2,3,4].map(i => (
                <div key={i} style={{ border: '2px solid #eee', overflow: 'hidden' }}>
                  <div className="skeleton" style={{ height: '4px' }} />
                  <div className="skeleton" style={{ height: '200px' }} />
                  <div style={{ padding: '14px 16px 16px' }}>
                    <div className="skeleton" style={{ height: '16px', marginBottom: '10px', width: '80%' }} />
                    <div className="skeleton" style={{ height: '12px', width: '55%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {services.map(service => <ServiceCard key={service.id} service={service} />)}
            </div>
          )}
        </SectionWrapper>
      )}

      <HowItWorks />
      <WhyChooseUs />
      <CTABanner />
    </>
  )
}
