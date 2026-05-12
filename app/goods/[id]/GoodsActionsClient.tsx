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
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
          ✓ This is your listing
        </div>
        <Link
          href="/my-listings"
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '14px', borderRadius: '10px' }}
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
        style={{ width: '100%', padding: '16px 40px', fontFamily: '"Syne", sans-serif', fontSize: '15px', border: 'none', borderRadius: '10px', cursor: 'pointer', letterSpacing: '0.5px', background: '#1B5E20', color: '#fff' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          MESSAGE SELLER
        </span>
      </button>

      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#25D366', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '14px', borderRadius: '10px', letterSpacing: '0.5px' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            CHAT ON WHATSAPP
          </span>
        </a>
      ) : !user ? (
        <Link
          href={`/auth/login?redirect=/goods/${productId}`}
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#888', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '14px', borderRadius: '10px', letterSpacing: '0.5px' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            LOGIN TO CONTACT SELLER
          </span>
        </Link>
      ) : null}

      <Link href="/goods" className="btn-secondary hover-lift" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px' }}>
        ← BACK TO LISTINGS
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WishlistButton productId={productId} size={36} />
          <span style={{ fontSize: '12px', color: '#888', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Save to wishlist</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleShare}
            title={copied ? 'Link copied!' : 'Share listing'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: copied ? '#dcfce7' : '#fff', border: '1px solid #E8E5E0', borderRadius: '8px', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '12px', color: copied ? '#15803d' : '#555', transition: 'all 0.2s' }}
          >
            {copied ? '✓ COPIED' : '↗ SHARE'}
          </button>
          <ReportModal productId={productId} reportedUserId={sellerId ?? undefined} itemName={productTitle} />
        </div>
      </div>
    </div>
  )
}
