"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { Good } from '@/lib/mockData'

interface GoodsCardProps {
  good: Good
}

const conditionColors: Record<string, { bg: string; color: string }> = {
  'New':      { bg: '#1B5E20', color: '#fff' },
  'Like New': { bg: '#1565C0', color: '#fff' },
  'Good':     { bg: '#E65100', color: '#fff' },
  'Fair':     { bg: '#6D4C41', color: '#fff' },
}

function VerifiedBadge() {
  return (
    <span
      title="Verified by Campus Connect"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '15px', height: '15px',
        background: '#1d9bf0', borderRadius: '50%',
        fontSize: '9px', color: '#fff', fontWeight: 900, flexShrink: 0,
      }}
    >✓</span>
  )
}

export default function GoodsCard({ good }: GoodsCardProps) {
  const cond = conditionColors[good.condition] || { bg: '#111', color: '#fff' }
  const router = useRouter()
  const { user } = useAuth()

  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (user) {
      router.push('/messages')
    } else {
      router.push('/auth/login?redirect=/messages')
    }
  }

  return (
    <Link href={`/goods/${good.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          border: '2px solid #eee', background: '#fff',
          overflow: 'hidden', transition: 'all 0.2s',
          cursor: 'pointer', height: '100%',
          display: 'flex', flexDirection: 'column',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = '#111'
          el.style.boxShadow = '4px 4px 0 #111'
          el.style.transform = 'translate(-2px, -2px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = '#eee'
          el.style.boxShadow = 'none'
          el.style.transform = 'none'
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: '#f0f0f0', flexShrink: 0 }}>
          <img
            src={good.image}
            alt={good.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.currentTarget.src = '/placeholder.jpg' }}
            loading="lazy"
          />
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            background: cond.bg, color: cond.color,
            fontSize: '10px', fontWeight: 700,
            padding: '4px 10px', letterSpacing: '0.5px',
            fontFamily: '"Space Grotesk", sans-serif',
          }}>
            {good.condition.toUpperCase()}
          </span>
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.75)', color: '#fff',
            fontSize: '10px', fontWeight: 700, padding: '4px 10px',
            fontFamily: '"Space Grotesk", sans-serif',
          }}>
            {good.views} views
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px', lineHeight: 1.3, color: '#111' }}>
            {good.name}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <img
              src={good.sellerImage}
              alt={good.seller}
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }}
              onError={(e) => { e.currentTarget.src = '/placeholder-user.jpg' }}
              loading="lazy"
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>{good.seller}</span>
            {good.sellerVerified && <VerifiedBadge />}
            <span style={{ fontSize: '11px', color: good.sellerRating > 0 ? '#f59e0b' : '#aaa', marginLeft: 'auto' }}>
              {good.sellerRating > 0 ? `⭐ ${good.sellerRating}/5` : '★ New'}
            </span>
          </div>

          <p style={{
            fontSize: '12px', color: '#888', marginBottom: '12px', lineHeight: 1.5,
            flex: 1, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {good.description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <div>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', color: '#5d3fd3', lineHeight: 1 }}>
                GHS {good.price}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '3px' }}>⏱ {good.createdAt}</div>
            </div>
            <div
              onClick={handleMessage}
              title={user ? 'Message seller' : 'Sign in to message seller'}
              style={{
                padding: '8px 14px',
                background: user ? '#111' : '#f0f0f0',
                color: user ? '#fff' : '#888',
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px',
                cursor: 'pointer',
                border: user ? 'none' : '1px solid #ddd',
              }}
            >
              {user ? 'MSG →' : '🔒 MSG'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
