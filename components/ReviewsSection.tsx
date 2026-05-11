"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: {
    id: string
    name: string | null
    avatar_url: string | null
    is_verified: boolean
  } | null
}

interface Props {
  productId?: string
  serviceId?: string
  revieweeId: string
}

function Star({ filled }: { filled: boolean }) {
  return (
    <span style={{ color: filled ? '#f59e0b' : '#ddd', fontSize: '18px', lineHeight: 1 }}>★</span>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontSize: '28px', color: (hover || value) >= n ? '#f59e0b' : '#ddd', lineHeight: 1, transition: 'color 0.1s' }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30) return `${d} days ago`
  const m = Math.floor(d / 30)
  if (m < 12) return `${m} month${m > 1 ? 's' : ''} ago`
  return `${Math.floor(m / 12)} year${Math.floor(m / 12) > 1 ? 's' : ''} ago`
}

export default function ReviewsSection({ productId, serviceId, revieweeId }: Props) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const fetchReviews = async () => {
    const param = productId ? `product=${productId}` : `service=${serviceId}`
    const res = await fetch(`/api/reviews?${param}`)
    if (res.ok) {
      const data = await res.json()
      setReviews(data.reviews ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchReviews() }, [productId, serviceId])

  const canReview = user && user.id !== revieweeId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) { setMsg({ type: 'err', text: 'Please select a star rating' }); return }
    setSubmitting(true)
    setMsg(null)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || undefined,
        product_id: productId,
        service_id: serviceId,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setMsg({ type: 'err', text: json.error ?? 'Something went wrong' })
    } else {
      setMsg({ type: 'ok', text: 'Review submitted — thank you!' })
      setRating(0)
      setComment('')
      setFormOpen(false)
      fetchReviews()
    }
    setSubmitting(false)
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <section style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid #111' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '22px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Reviews
          </h3>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: '"Archivo Black"', fontSize: '28px', color: '#f59e0b' }}>{avgRating}</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(n => <Star key={n} filled={n <= Math.round(Number(avgRating))} />)}
              </div>
              <span style={{ fontSize: '13px', color: '#888' }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>

        {canReview && !formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            style={{ padding: '10px 20px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', border: '2px solid #111', cursor: 'pointer', letterSpacing: '0.5px', boxShadow: '3px 3px 0 #1B5E20' }}
          >
            + WRITE A REVIEW
          </button>
        )}
      </div>

      {/* Review Form */}
      {canReview && formOpen && (
        <form onSubmit={handleSubmit} style={{ border: '2px solid #111', padding: '24px', background: '#fff', boxShadow: '4px 4px 0 #111', marginBottom: '32px' }}>
          <div style={{ fontFamily: '"Archivo Black"', fontSize: '14px', letterSpacing: '0.5px', marginBottom: '16px' }}>YOUR RATING</div>

          <StarPicker value={rating} onChange={setRating} />

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience... (optional)"
            rows={3}
            maxLength={500}
            style={{ display: 'block', width: '100%', marginTop: '16px', padding: '12px', border: '2px solid #ddd', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.currentTarget.style.borderColor = '#111'}
            onBlur={e => e.currentTarget.style.borderColor = '#ddd'}
          />
          <div style={{ fontSize: '11px', color: '#aaa', textAlign: 'right', marginTop: '4px' }}>{comment.length}/500</div>

          {msg && (
            <div style={{ marginTop: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2', color: msg.type === 'ok' ? '#15803d' : '#dc2626', border: `1px solid ${msg.type === 'ok' ? '#16a34a' : '#ef4444'}` }}>
              {msg.text}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '12px 24px', background: submitting ? '#888' : '#1B5E20', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', border: '2px solid #111', cursor: submitting ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', boxShadow: '3px 3px 0 #111' }}
            >
              {submitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
            </button>
            <button
              type="button"
              onClick={() => { setFormOpen(false); setMsg(null) }}
              style={{ padding: '12px 18px', background: '#fff', color: '#666', fontWeight: 700, border: '2px solid #ddd', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontSize: '13px' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!user && (
        <div style={{ padding: '14px 18px', background: '#f0f0f0', border: '2px solid #ddd', fontSize: '13px', color: '#666', marginBottom: '24px' }}>
          <a href="/auth/login" style={{ color: '#1B5E20', fontWeight: 700 }}>Log in</a> to leave a review.
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1,2].map(i => (
            <div key={i} style={{ height: '80px', background: '#f0f0f0', border: '2px solid #eee', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', border: '2px dashed #ddd', background: '#fafafa', color: '#888' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>★</div>
          <div style={{ fontWeight: 700 }}>No reviews yet</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Be the first to leave a review</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map(review => (
            <div key={review.id} style={{ border: '2px solid #eee', padding: '20px', background: '#fff', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  {review.reviewer?.avatar_url ? (
                    <Image
                      src={review.reviewer.avatar_url}
                      alt={review.reviewer.name ?? 'Student'}
                      width={40} height={40}
                      style={{ borderRadius: '50%', border: '2px solid #eee', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', border: '2px solid #eee' }}>
                      {(review.reviewer?.name ?? 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>
                      {review.reviewer?.name ?? 'Campus Student'}
                    </span>
                    {review.reviewer?.is_verified && (
                      <span title="Verified" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', background: '#1d9bf0', borderRadius: '50%', fontSize: '9px', color: '#fff', fontWeight: 900 }}>✓</span>
                    )}
                    <div style={{ display: 'flex', gap: '1px' }}>
                      {[1,2,3,4,5].map(n => <Star key={n} filled={n <= review.rating} />)}
                    </div>
                    <span style={{ fontSize: '12px', color: '#aaa', marginLeft: 'auto' }}>{timeAgo(review.created_at)}</span>
                  </div>
                  {review.comment && (
                    <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.6, margin: 0 }}>{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
