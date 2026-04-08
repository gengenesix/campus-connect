"use client"

import { useState, useEffect } from 'react'
import Link from "next/link"
import GoodsCard from "@/components/GoodsCard"
import ServiceCard from "@/components/ServiceCard"
import { supabase } from "@/lib/supabase"
import type { Good, Service } from "@/lib/mockData"
import { timeAgo } from "@/lib/utils"

export default function HomePage() {
  const [goods, setGoods] = useState<Good[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      const [{ data: productsData }, { data: servicesData }] = await Promise.all([
        supabase
          .from('products')
          .select(`id, seller_id, title, price, condition, category, image_url, views, description, created_at, seller:profiles!seller_id (name, avatar_url, rating, is_verified)`)
          .neq('status', 'deleted')
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('services')
          .select(`id, provider_id, name, category, rate, image_url, description, response_time, total_bookings, availability, provider:profiles!provider_id (name, avatar_url, rating, is_verified)`)
          .neq('status', 'deleted')
          .order('total_bookings', { ascending: false })
          .limit(4),
      ])

      setGoods(
        (productsData ?? []).map((p: any) => ({
          id: p.id,
          name: p.title,
          price: p.price,
          condition: p.condition,
          category: p.category ?? 'Other',
          seller: p.seller?.name ?? 'UMaT Student',
          sellerId: p.seller_id,
          sellerImage: p.seller?.avatar_url ?? '/placeholder-user.jpg',
          sellerRating: p.seller?.rating ?? 0,
          sellerVerified: p.seller?.is_verified ?? false,
          image: p.image_url ?? '/placeholder.jpg',
          description: p.description ?? '',
          createdAt: timeAgo(p.created_at),
          views: p.views ?? 0,
        }))
      )

      setServices(
        (servicesData ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          provider: s.provider?.name ?? 'UMaT Student',
          providerId: s.provider_id,
          providerImage: s.provider?.avatar_url ?? '/placeholder-user.jpg',
          providerRating: s.provider?.rating ?? 0,
          providerVerified: s.provider?.is_verified ?? false,
          category: s.category,
          rate: s.rate ?? 'Contact for pricing',
          description: s.description ?? '',
          availability: s.availability ?? 'Contact provider',
          image: s.image_url ?? '/placeholder.jpg',
          responseTime: s.response_time ?? 'Varies',
          bookings: s.total_bookings ?? 0,
        }))
      )

      setLoadingData(false)
    }

    fetchFeatured()
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="season-badge">UMAT COMMUNITY · TARKWA</div>
          <h1 className="hero-headline">
            BUY, SELL
            <br />
            & <span className="hero-headline-highlight">CONNECT</span>
          </h1>
          <p className="hero-subtext">
            The free peer-to-peer marketplace for UMaT students. Buy goods, book campus services, connect with fellow students. Zero commission. Zero fees.
          </p>
          <div className="cta-buttons">
            <Link href="/goods" className="btn-primary hover-lift">
              BROWSE GOODS
            </Link>
            <Link href="/services" className="btn-secondary hover-lift">
              FIND SERVICES
            </Link>
          </div>
          <div className="social-proof">
            <div className="avatar-stack">
              <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face" alt="Student" />
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face" alt="Student" />
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" alt="Student" />
            </div>
            <div>
              <div className="social-proof-title">UMaT Campus Community</div>
              <div className="social-proof-subtitle">Students buying, selling &amp; connecting</div>
            </div>
          </div>
        </div>

        {/* Right Visual Collage */}
        <div className="hero-visuals">
          <svg className="abstract-shape" width="600" height="600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#1B5E20" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,31.6C59,41.7,47.1,49,35.3,55.1C23.5,61.2,11.8,66.1,-0.6,67.1C-12.9,68.1,-25.8,65.2,-37.9,59.2C-50,53.2,-61.3,44.1,-70.5,32.6C-79.7,21.1,-86.8,7.2,-85.1,-6.1C-83.3,-19.4,-72.7,-32.1,-61.6,-41.8C-50.5,-51.5,-38.9,-58.2,-27.1,-66.9C-15.3,-75.6,-3.3,-86.3,10.2,-83.8C23.7,-81.3,30.5,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
          <div className="main-image-container">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="UMaT students"
            />
            <div className="price-tag" style={{ backgroundColor: '#1B5E20', color: '#fff' }}>FREE</div>
          </div>
          <div className="secondary-image">
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
              alt="Students connecting"
            />
          </div>
          <div className="sticker-graphic">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
              alt="UMaT student"
            />
            <div className="hot-badge">LIVE</div>
          </div>
          <svg className="decorative-star" width="80" height="80" viewBox="0 0 24 24" fill="#1B5E20" stroke="#000" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      </section>

      {/* Stats Strip */}
      <div style={{ background: '#111', color: '#fff', padding: '28px 20px', borderTop: '3px solid #1B5E20' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', textAlign: 'center' }}>
          {[
            { num: '0%', label: 'COMMISSION' },
            { num: '100%', label: 'FREE FOREVER' },
            { num: 'P2P', label: 'DIRECT DEALS' },
            { num: 'UMaT', label: 'CAMPUS ONLY' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px', color: '#a78bfa' }}>{s.num}</div>
              <div style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#666', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Goods */}
      <section className="trending-section" id="featured">
        <div className="container">
          <div className="trending-header">
            <h3>Latest Goods</h3>
            <Link href="/goods">See All →</Link>
          </div>
          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontWeight: 600 }}>Loading listings...</div>
          ) : goods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed #ddd' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', marginBottom: '8px' }}>NO LISTINGS YET</div>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>Be the first to list something on Campus Connect!</p>
              <Link href="/sell" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 28px' }}>
                LIST AN ITEM →
              </Link>
            </div>
          ) : (
            <div className="product-grid">
              {goods.map(good => (
                <GoodsCard key={good.id} good={good} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Services */}
      <section className="trending-section" style={{ background: '#f5f5f5' }}>
        <div className="container">
          <div className="trending-header">
            <h3>Popular Services</h3>
            <Link href="/services">See All →</Link>
          </div>
          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontWeight: 600 }}>Loading services...</div>
          ) : services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed #ddd' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛠️</div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', marginBottom: '8px' }}>NO SERVICES YET</div>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>Have skills? Be the first to offer a campus service!</p>
              <Link href="/offer-service" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 28px' }}>
                OFFER A SERVICE →
              </Link>
            </div>
          ) : (
            <div className="product-grid">
              {services.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: '#fff', padding: '60px 20px', borderTop: '2px solid #111' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', marginBottom: '8px' }}>HOW IT WORKS</div>
            <p style={{ color: '#666', fontSize: '16px' }}>Three simple steps to buy, sell, or book on campus</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up free with your student email. No credit card needed.', icon: '👤' },
              { step: '02', title: 'List or Browse', desc: 'Post your items for sale or browse goods and services from fellow students.', icon: '📋' },
              { step: '03', title: 'Connect & Deal', desc: 'Message sellers directly, book services, and meet safely on campus.', icon: '🤝' },
            ].map(item => (
              <div key={item.step} style={{ border: '2px solid #111', padding: '32px', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
                <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px', color: '#eee', lineHeight: 1 }}>{item.step}</div>
                <div style={{ fontSize: '32px', marginBottom: '12px', marginTop: '8px' }}>{item.icon}</div>
                <h3 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1B5E20', padding: '60px 20px', textAlign: 'center', color: '#fff' }}>
        <div className="container">
          <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '42px', marginBottom: '16px' }}>
            Ready to Join the Community?
          </h2>
          <p style={{ fontSize: '18px', maxWidth: '560px', margin: '0 auto 36px', color: 'rgba(255,255,255,0.8)' }}>
            Free forever. No commission. No hidden fees. Just pure campus community.
          </p>
          <div className="cta-buttons" style={{ justifyContent: 'center' }}>
            <Link href="/auth/register" style={{
              display: 'inline-block', padding: '18px 48px',
              background: '#fff', color: '#1B5E20',
              fontFamily: '"Archivo Black", sans-serif', fontSize: '16px',
              textDecoration: 'none', border: '2px solid #fff',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
            }}>
              JOIN FREE
            </Link>
            <Link href="/goods" style={{
              display: 'inline-block', padding: '18px 48px',
              background: 'transparent', color: '#fff',
              fontFamily: '"Archivo Black", sans-serif', fontSize: '16px',
              textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)',
            }}>
              BROWSE FIRST
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
