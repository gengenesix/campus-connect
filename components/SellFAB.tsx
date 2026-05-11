"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function SellFAB() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  // Hide on sell/offer-service/auth pages and desktop (CSS)
  const hidden = pathname.startsWith('/sell') || pathname.startsWith('/offer-service') || pathname.startsWith('/auth/') || pathname.startsWith('/wishlist')
  if (hidden) return null

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          onClick={() => setOpen(false)}
        />
      )}

      <div style={{
        position: 'fixed',
        bottom: '84px', // above mobile nav
        right: '18px',
        zIndex: 999,
        display: 'none',
      }}
      className="sell-fab-container"
      >
        {/* Menu options */}
        {open && (
          <div style={{
            position: 'absolute', bottom: '60px', right: 0,
            display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end',
          }}>
            <Link
              href={user ? '/offer-service' : '/auth/login?redirect=/offer-service'}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', background: '#1B5E20', color: '#fff',
                textDecoration: 'none', fontFamily: '"Archivo Black", sans-serif',
                fontSize: '12px', letterSpacing: '0.5px',
                border: '2px solid #111', boxShadow: '3px 3px 0 #111',
                whiteSpace: 'nowrap',
              }}
            >
              🛠 OFFER SERVICE
            </Link>
            <Link
              href={user ? '/sell' : '/auth/login?redirect=/sell'}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', background: '#5d3fd3', color: '#fff',
                textDecoration: 'none', fontFamily: '"Archivo Black", sans-serif',
                fontSize: '12px', letterSpacing: '0.5px',
                border: '2px solid #111', boxShadow: '3px 3px 0 #111',
                whiteSpace: 'nowrap',
              }}
            >
              📦 SELL ITEM
            </Link>
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '52px', height: '52px',
            background: open ? '#ff3366' : '#111',
            color: '#fff',
            border: '3px solid #111',
            boxShadow: open ? '4px 4px 0 #ff3366' : '4px 4px 0 #a78bfa',
            cursor: 'pointer',
            fontSize: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            transform: open ? 'rotate(45deg)' : 'none',
          }}
        >
          +
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sell-fab-container {
            display: block !important;
          }
        }
      `}</style>
    </>
  )
}
