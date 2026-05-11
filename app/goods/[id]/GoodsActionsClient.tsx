"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import WishlistButton from '@/components/WishlistButton'
import ReportModal from '@/components/ReportModal'

interface Props {
  productId: string
  sellerId: string | null
  whatsappHref: string | null
  productTitle: string
}

export default function GoodsActionsClient({ productId, sellerId, whatsappHref, productTitle }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const isMine = user?.id === sellerId
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: productTitle, url })
        return
      } catch {}
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [productTitle])

  // Increment view count once per product per 24h (localStorage dedup)
  useEffect(() => {
    try {
      const key = `viewed:${productId}`
      const last = localStorage.getItem(key)
      const now = Date.now()
      if (!last || now - parseInt(last, 10) > 86_400_000) {
        supabase.rpc('increment_product_views', { product_id: productId })
        localStorage.setItem(key, String(now))
      }
    } catch {}
  }, [productId])

  const handleMessage = () => {
    if (!user) { router.push(`/auth/login?redirect=/goods/${productId}`); return }
    if (sellerId) router.push(`/messages?with=${sellerId}&product=${productId}&title=${encodeURIComponent(productTitle)}`)
  }

  if (isMine) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '2px solid #1B5E20', fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
          ✓ This is your listing
        </div>
        <Link
          href="/my-listings"
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}
        >
          MANAGE MY LISTINGS →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
      <button
        onClick={handleMessage}
        className="btn-primary hover-lift"
        style={{ width: '100%', padding: '16px 40px', fontFamily: '"Archivo Black", sans-serif', fontSize: '15px', border: '2px solid #111', boxShadow: '4px 4px 0 #111', cursor: 'pointer', letterSpacing: '0.5px', background: '#111', color: '#fff' }}
      >
        💬 MESSAGE SELLER
      </button>

      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#25D366', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111', letterSpacing: '0.5px' }}
        >
          📱 CHAT ON WHATSAPP
        </a>
      ) : !user ? (
        <Link
          href={`/auth/login?redirect=/goods/${productId}`}
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#888', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111', letterSpacing: '0.5px' }}
        >
          🔒 LOGIN TO CONTACT SELLER
        </Link>
      ) : null}

      <Link href="/goods" className="btn-secondary hover-lift" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px' }}>
        ← BACK TO LISTINGS
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WishlistButton productId={productId} size={36} />
          <span style={{ fontSize: '12px', color: '#888', fontFamily: '"Space Grotesk", sans-serif' }}>Save to wishlist</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleShare}
            title={copied ? 'Link copied!' : 'Share listing'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: copied ? '#dcfce7' : '#fff', border: '2px solid #ddd', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '12px', color: copied ? '#15803d' : '#555', transition: 'all 0.2s' }}
          >
            {copied ? '✓ COPIED' : '↗ SHARE'}
          </button>
          <ReportModal productId={productId} reportedUserId={sellerId ?? undefined} itemName={productTitle} />
        </div>
      </div>
    </div>
  )
}
