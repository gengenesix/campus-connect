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
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
          ✓ This is your service listing
        </div>
        <Link
          href="/dashboard"
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '14px', borderRadius: '10px' }}
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
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '18px 40px', background: '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '16px', borderRadius: '10px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            LOGIN TO BOOK
          </span>
        </Link>
        <Link href="/services" className="btn-secondary hover-lift" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '16px 40px' }}>
          ← BACK TO SERVICES
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WishlistButton serviceId={serviceId} size={36} />
            <span style={{ fontSize: '12px', color: '#888', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Save to wishlist</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleShare}
              title={copied ? 'Link copied!' : 'Share service'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: copied ? '#dcfce7' : '#fff', border: '1px solid #E8E5E0', borderRadius: '8px', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '12px', color: copied ? '#15803d' : '#555', transition: 'all 0.2s' }}
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
        <div style={{ padding: '20px 24px', background: '#e8f5e9', border: '1px solid #86efac', borderRadius: '12px' }}>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '16px', color: '#1B5E20', marginBottom: '6px' }}>
            ✓ BOOKING REQUESTED!
          </div>
          <div style={{ fontSize: '13px', color: '#15803d', lineHeight: 1.5 }}>
            Your request has been sent to the provider. You&apos;ll get notified when they confirm.
          </div>
        </div>
        <Link href="/bookings" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px', background: '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '13px', borderRadius: '10px' }}>
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {error}
            </span>
          </div>
        )}

        {/* Primary: Book Service */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            textAlign: 'center', display: 'block', width: '100%', cursor: 'pointer',
            padding: '18px 40px', background: '#1B5E20', color: '#fff',
            fontFamily: '"Syne", sans-serif', fontSize: '16px',
            border: 'none', borderRadius: '10px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            BOOK THIS SERVICE
          </span>
        </button>

        {/* Secondary: Message */}
        {providerId && (
          <button
            onClick={() => router.push(`/messages?with=${providerId}&title=${encodeURIComponent(serviceName)}`)}
            style={{
              textAlign: 'center', display: 'block', width: '100%', cursor: 'pointer',
              padding: '14px 40px', background: '#fff', color: '#111',
              fontFamily: '"Syne", sans-serif', fontSize: '14px',
              border: '1px solid #E8E5E0', borderRadius: '10px', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8f8f8' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              MESSAGE PROVIDER
            </span>
          </button>
        )}

        {/* Tertiary: WhatsApp */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '12px 40px', background: '#f0fdf4', color: '#1B5E20', fontWeight: 700, fontSize: '14px', border: '1px dashed #86efac', borderRadius: '10px', transition: 'all 0.15s' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1B5E20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.828L.057 23.704a.5.5 0 0 0 .613.63l5.701-1.494A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.892 0-3.657-.528-5.16-1.444l-.37-.22-3.834 1.005.987-3.715-.242-.383A9.952 9.952 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
            WHATSAPP INSTEAD
          </span>
        </a>

        <Link href="/services" className="btn-secondary hover-lift" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', padding: '14px 40px' }}>
          ← BACK TO SERVICES
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WishlistButton serviceId={serviceId} size={36} />
            <span style={{ fontSize: '12px', color: '#888', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Save to wishlist</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleShare}
              title={copied ? 'Link copied!' : 'Share service'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: copied ? '#dcfce7' : '#fff', border: '1px solid #E8E5E0', borderRadius: '8px', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '12px', color: copied ? '#15803d' : '#555', transition: 'all 0.2s' }}
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
            background: '#fff', border: '1px solid #E8E5E0', borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxWidth: '480px', width: '100%', overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{ background: '#FAFAF8', borderBottom: '1px solid #E8E5E0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '15px', letterSpacing: '0.5px', color: '#111' }}>
                Book Service
              </span>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#6B6660', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
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
                    width: '100%', padding: '10px 12px', border: '1px solid #E8E5E0',
                    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
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
                    width: '100%', padding: '10px 12px', border: '1px solid #E8E5E0',
                    borderRadius: '8px', fontSize: '14px', resize: 'vertical', outline: 'none',
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
                    fontFamily: '"Syne", sans-serif', fontSize: '14px',
                    border: 'none', borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {loading ? 'SENDING...' : 'SEND BOOKING REQUEST'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '14px 20px', background: '#F0F0EE', color: '#111',
                    fontWeight: 700, fontSize: '14px',
                    border: '1px solid #E8E5E0', borderRadius: '10px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>

              <div style={{ marginTop: '16px', padding: '10px 12px', background: '#f8f8f8', border: '1px solid #eee', fontSize: '12px', color: '#888', lineHeight: 1.5 }}>
                <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '6px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  The provider will review your request and confirm it. You can message them directly with more details.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
