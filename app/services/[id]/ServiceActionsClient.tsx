"use client"

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import WishlistButton from '@/components/WishlistButton'
import ReportModal from '@/components/ReportModal'

interface Props {
  serviceId: string
  serviceName: string
  providerId: string | null
  whatsappHref: string
}

export default function ServiceActionsClient({ serviceId, serviceName, providerId, whatsappHref }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const isOwn = user?.id === providerId

  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notes, setNotes] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: serviceName, url }); return } catch {}
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [serviceName])

  const handleBook = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          notes: notes.trim() || undefined,
          scheduled_at: scheduledAt || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
      } else {
        setSuccess(true)
        setShowModal(false)
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (isOwn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '2px solid #1B5E20', fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
          ✓ This is your service listing
        </div>
        <Link
          href="/dashboard"
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}
        >
          MANAGE MY SERVICES →
        </Link>
        <Link href="/services" className="btn-secondary hover-lift" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '16px 40px' }}>
          ← BACK TO SERVICES
        </Link>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <Link
          href={`/auth/login?redirect=/services/${serviceId}`}
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '18px 40px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}
        >
          🔒 LOGIN TO BOOK
        </Link>
        <Link href="/services" className="btn-secondary hover-lift" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '16px 40px' }}>
          ← BACK TO SERVICES
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WishlistButton serviceId={serviceId} size={36} />
            <span style={{ fontSize: '12px', color: '#888', fontFamily: '"Space Grotesk", sans-serif' }}>Save to wishlist</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleShare}
              title={copied ? 'Link copied!' : 'Share service'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: copied ? '#dcfce7' : '#fff', border: '2px solid #ddd', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '12px', color: copied ? '#15803d' : '#555', transition: 'all 0.2s' }}
            >
              {copied ? '✓ COPIED' : '↗ SHARE'}
            </button>
            <ReportModal serviceId={serviceId} reportedUserId={providerId ?? undefined} itemName={serviceName} />
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <div style={{ padding: '20px 24px', background: '#e8f5e9', border: '2px solid #1B5E20', boxShadow: '4px 4px 0 #1B5E20' }}>
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', color: '#1B5E20', marginBottom: '6px' }}>
            ✓ BOOKING REQUESTED!
          </div>
          <div style={{ fontSize: '13px', color: '#15803d', lineHeight: 1.5 }}>
            Your request has been sent to the provider. You&apos;ll get notified when they confirm.
          </div>
        </div>
        <Link href="/bookings" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', border: '2px solid #111', boxShadow: '3px 3px 0 #111' }}>
          VIEW MY BOOKINGS →
        </Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {error && (
          <div style={{ padding: '12px 16px', background: '#fff0f0', border: '2px solid #ff3366', fontSize: '13px', color: '#cc0033', fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        {/* Primary: Book Service */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            textAlign: 'center', display: 'block', width: '100%', cursor: 'pointer',
            padding: '18px 40px', background: '#1B5E20', color: '#fff',
            fontFamily: '"Archivo Black", sans-serif', fontSize: '16px',
            border: '2px solid #111', boxShadow: '4px 4px 0 #111', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #111' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #111' }}
        >
          📅 BOOK THIS SERVICE
        </button>

        {/* Secondary: Message */}
        {providerId && (
          <button
            onClick={() => router.push(`/messages?with=${providerId}&title=${encodeURIComponent(serviceName)}`)}
            style={{
              textAlign: 'center', display: 'block', width: '100%', cursor: 'pointer',
              padding: '14px 40px', background: '#fff', color: '#111',
              fontFamily: '"Archivo Black", sans-serif', fontSize: '14px',
              border: '2px solid #111', boxShadow: '3px 3px 0 #111', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8f8f8' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
          >
            💬 MESSAGE PROVIDER
          </button>
        )}

        {/* Tertiary: WhatsApp */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '12px 40px', background: '#f0fdf4', color: '#1B5E20', fontWeight: 700, fontSize: '14px', border: '2px dashed #86efac', transition: 'all 0.15s' }}
        >
          📲 WHATSAPP INSTEAD
        </a>

        <Link href="/services" className="btn-secondary hover-lift" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px' }}>
          ← BACK TO SERVICES
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WishlistButton serviceId={serviceId} size={36} />
            <span style={{ fontSize: '12px', color: '#888', fontFamily: '"Space Grotesk", sans-serif' }}>Save to wishlist</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleShare}
              title={copied ? 'Link copied!' : 'Share service'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: copied ? '#dcfce7' : '#fff', border: '2px solid #ddd', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '12px', color: copied ? '#15803d' : '#555', transition: 'all 0.2s' }}
            >
              {copied ? '✓ COPIED' : '↗ SHARE'}
            </button>
            <ReportModal serviceId={serviceId} reportedUserId={providerId ?? undefined} itemName={serviceName} />
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{
            background: '#fff', border: '3px solid #111', boxShadow: '8px 8px 0 #111',
            maxWidth: '480px', width: '100%',
          }}>
            {/* Modal header */}
            <div style={{ background: '#111', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '15px', letterSpacing: '0.5px' }}>
                BOOK SERVICE
              </span>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '28px 24px' }}>
              <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 700, letterSpacing: '1px', marginBottom: '4px' }}>SERVICE</div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>{serviceName}</div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: '#111', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Preferred Date / Time <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{
                    width: '100%', padding: '10px 12px', border: '2px solid #ddd',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#ddd')}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: '#111', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Notes for Provider <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="What do you need? Any specific details..."
                  style={{
                    width: '100%', padding: '10px 12px', border: '2px solid #ddd',
                    fontSize: '14px', resize: 'vertical', outline: 'none',
                    fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#ddd')}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#bbb', marginTop: '4px' }}>{notes.length}/500</div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleBook}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '14px', background: loading ? '#888' : '#1B5E20', color: '#fff',
                    fontFamily: '"Archivo Black", sans-serif', fontSize: '14px',
                    border: '2px solid #111', boxShadow: '3px 3px 0 #111',
                    cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {loading ? 'SENDING...' : 'SEND BOOKING REQUEST'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '14px 20px', background: '#f0f0f0', color: '#111',
                    fontWeight: 700, fontSize: '14px',
                    border: '2px solid #ddd', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>

              <div style={{ marginTop: '16px', padding: '10px 12px', background: '#f8f8f8', border: '1px solid #eee', fontSize: '12px', color: '#888', lineHeight: 1.5 }}>
                📌 The provider will review your request and confirm it. You can message them directly with more details.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
