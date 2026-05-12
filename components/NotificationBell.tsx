"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  message: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d3fd3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  listing_approved: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  listing_rejected: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  new_review: <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  booking_request: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  booking_confirmed: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
  system: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
}

// Convert VAPID public key from base64url to ArrayBuffer for pushManager.subscribe
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return buffer
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getNotifLink(n: Notification): string {
  const data = n.data ?? {}
  if (n.type === 'message') return '/messages'
  if (n.type === 'listing_approved' || n.type === 'listing_rejected') {
    const type = data.listingType === 'service' ? 'services' : 'goods'
    return data.listingId ? `/${type}/${data.listingId}` : '/my-listings'
  }
  if (n.type === 'booking_request' || n.type === 'booking_confirmed') return '/bookings'
  return '/dashboard'
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pushGranted, setPushGranted] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPushGranted(Notification.permission === 'granted')
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (!res.ok) return
      const json = await res.json()
      setNotifications(json.notifications ?? [])
      setUnreadCount(json.unreadCount ?? 0)
    } catch {}
  }, [])

  // Fetch on mount + poll every 30 seconds
  useEffect(() => {
    fetchNotifications()
    pollRef.current = setInterval(fetchNotifications, 30000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    setOpen(o => !o)
    if (!open) {
      setLoading(true)
      await fetchNotifications()
      setLoading(false)
    }
  }

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: unreadIds }),
    })
  }

  const subscribeToPush = async () => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return
    setPushLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setPushLoading(false); return }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) { console.warn('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set'); setPushLoading(false); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      setPushGranted(true)
    } catch (err) {
      console.error('[push] Subscribe error:', err)
    }
    setPushLoading(false)
  }

  const markOneRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell icon */}
      <button
        onClick={handleOpen}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: '#ff3366',
            color: '#fff',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 700,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            border: '1.5px solid #fff',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '320px',
          background: '#fff',
          border: '2px solid #111',
          boxShadow: '6px 6px 0 #111',
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '13px', letterSpacing: '0.5px' }}>
              NOTIFICATIONS
              {unreadCount > 0 && (
                <span style={{ marginLeft: '8px', background: '#ff3366', color: '#fff', fontSize: '9px', padding: '2px 6px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  {unreadCount} NEW
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: '#5d3fd3', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                MARK ALL READ
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Loading...
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', color: '#ddd' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px', color: '#888' }}>
                  No notifications yet
                </div>
              </div>
            )}
            {!loading && notifications.map(n => (
              <Link
                key={n.id}
                href={getNotifLink(n)}
                onClick={() => { if (!n.read) markOneRead(n.id); setOpen(false) }}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  textDecoration: 'none',
                  color: '#111',
                  background: n.read ? 'transparent' : '#fafafa',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f5f5f5'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : '#fafafa'}
              >
                <div style={{ flexShrink: 0, marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#f8f8f8', borderRadius: '50%' }}>
                  {TYPE_ICON[n.type] ?? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '13px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {n.title}
                    {!n.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3366', flexShrink: 0, display: 'inline-block' }} />}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.body}
                  </div>
                  <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {notifications.length > 0 && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '12px', fontWeight: 700, color: '#5d3fd3', textDecoration: 'none', letterSpacing: '0.5px' }}
              >
                VIEW ALL IN DASHBOARD →
              </Link>
            )}
            {!pushGranted && typeof Notification !== 'undefined' && Notification.permission !== 'denied' && (
              <button
                onClick={subscribeToPush}
                disabled={pushLoading}
                style={{
                  marginLeft: 'auto',
                  background: '#1B5E20', color: '#fff', border: 'none',
                  padding: '4px 10px',
                  fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '10px', fontWeight: 700,
                  cursor: pushLoading ? 'wait' : 'pointer', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                }}
                title="Get push notifications for new messages and bookings"
              >
                {pushLoading ? '...' : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    ENABLE PUSH
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
