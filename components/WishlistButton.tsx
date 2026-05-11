"use client"

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

interface Props {
  productId?: string
  serviceId?: string
  initialSaved?: boolean
  size?: number
}

export default function WishlistButton({ productId, serviceId, initialSaved = false, size = 32 }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      router.push('/auth/login')
      return
    }

    setLoading(true)
    const prev = saved
    setSaved(!prev) // optimistic

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, serviceId }),
      })
      if (!res.ok) setSaved(prev) // revert on error
    } catch {
      setSaved(prev)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: saved ? '#ff3366' : 'rgba(255,255,255,0.92)',
        border: `2px solid ${saved ? '#ff3366' : '#111'}`,
        borderRadius: '0',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
        boxShadow: saved ? '2px 2px 0 #111' : 'none',
        padding: 0,
      }}
      onMouseEnter={e => {
        if (!saved) (e.currentTarget as HTMLElement).style.background = '#ffe4ec'
      }}
      onMouseLeave={e => {
        if (!saved) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.92)'
      }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill={saved ? '#fff' : 'none'}
        stroke={saved ? '#fff' : '#111'}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
