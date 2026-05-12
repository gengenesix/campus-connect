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
                textDecoration: 'none', fontFamily: '"Syne", sans-serif',
                fontSize: '12px', letterSpacing: '0.5px',
                border: '2px solid #111', boxShadow: '3px 3px 0 #111',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              OFFER SERVICE
            </Link>
            <Link
              href={user ? '/sell' : '/auth/login?redirect=/sell'}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', background: '#5d3fd3', color: '#fff',
                textDecoration: 'none', fontFamily: '"Syne", sans-serif',
                fontSize: '12px', letterSpacing: '0.5px',
                border: '2px solid #111', boxShadow: '3px 3px 0 #111',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              SELL ITEM
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
