"use client"

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

const REASONS = [
  { value: 'spam',         label: 'Spam / Fake listing' },
  { value: 'fraud',        label: 'Scam / Fraud attempt' },
  { value: 'inappropriate',label: 'Inappropriate content' },
  { value: 'wrong_price',  label: 'Wrong / misleading price' },
  { value: 'already_sold', label: 'Item already sold' },
  { value: 'other',        label: 'Other' },
] as const

interface Props {
  productId?: string
  serviceId?: string
  reportedUserId?: string
  itemName: string
}

export default function ReportModal({ productId, serviceId, reportedUserId, itemName }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!reason) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, serviceId, reportedUserId, reason, details: details.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong'); return }
      setDone(true)
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return (
    <button
      onClick={() => router.push('/auth/login')}
      style={{ background: 'none', border: 'none', color: '#bbb', fontSize: '12px', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', padding: '4px 0' }}
    >
      ⚑ Report
    </button>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ background: 'none', border: 'none', color: '#bbb', fontSize: '12px', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', padding: '4px 0', transition: 'color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#ff3366')}
        onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
      >
        ⚑ Report
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) { setOpen(false); setDone(false); setReason(''); setDetails(''); setError(null) } }}
        >
          <div style={{ background: '#fff', border: '3px solid #111', boxShadow: '8px 8px 0 #111', maxWidth: '440px', width: '100%' }}>
            <div style={{ background: '#ff3366', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', letterSpacing: '0.5px' }}>REPORT</span>
              <button onClick={() => { setOpen(false); setDone(false); setReason(''); setDetails(''); setError(null) }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: '24px 20px' }}>
              {done ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
                  <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', marginBottom: '8px', color: '#1B5E20' }}>REPORT SUBMITTED</div>
                  <p style={{ color: '#666', fontSize: '13px', lineHeight: 1.6 }}>Thank you. Our team will review this and take action if needed.</p>
                  <button
                    onClick={() => { setOpen(false); setDone(false) }}
                    style={{ marginTop: '20px', padding: '10px 24px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', border: '2px solid #111', cursor: 'pointer' }}
                  >
                    CLOSE
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: 1.5 }}>
                    Reporting: <strong style={{ color: '#111' }}>{itemName}</strong>
                  </div>

                  {error && (
                    <div style={{ padding: '10px 14px', background: '#fff0f0', border: '2px solid #ff3366', fontSize: '13px', color: '#cc0033', marginBottom: '16px' }}>
                      {error}
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px', color: '#111' }}>REASON *</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {REASONS.map(r => (
                        <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: `2px solid ${reason === r.value ? '#111' : '#eee'}`, cursor: 'pointer', background: reason === r.value ? '#f8f8f8' : '#fff', transition: '0.1s' }}>
                          <input
                            type="radio" name="reason" value={r.value}
                            checked={reason === r.value}
                            onChange={() => setReason(r.value)}
                            style={{ accentColor: '#111' }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: reason === r.value ? 700 : 500 }}>{r.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px', color: '#111' }}>ADDITIONAL DETAILS <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></div>
                    <textarea
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Any extra context..."
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #ddd', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#ff3366')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#ddd')}
                    />
                  </div>

                  <button
                    onClick={submit}
                    disabled={loading || !reason}
                    style={{
                      width: '100%', padding: '13px', background: (!reason || loading) ? '#888' : '#ff3366',
                      color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px',
                      border: '2px solid #111', cursor: (!reason || loading) ? 'not-allowed' : 'pointer',
                      boxShadow: (!reason || loading) ? 'none' : '3px 3px 0 #111', letterSpacing: '0.5px',
                    }}
                  >
                    {loading ? 'SUBMITTING...' : 'SUBMIT REPORT'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
