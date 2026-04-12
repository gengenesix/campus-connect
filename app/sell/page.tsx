"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Furniture', 'Sports', 'Other'] as const
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const

type Category = typeof CATEGORIES[number]
type Condition = typeof CONDITIONS[number]

/** Normalise a Ghana phone number to +233XXXXXXXXX format */
function normaliseGhanaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) return '+233' + digits.slice(1)
  if (digits.startsWith('233') && digits.length === 12) return '+' + digits
  if (digits.startsWith('233') && digits.length === 12) return '+' + digits
  if (digits.length >= 9) return '+233' + digits.slice(-9)
  return raw.trim()
}

function isValidGhanaPhone(val: string): boolean {
  if (!val.trim()) return true // optional
  const digits = val.replace(/\D/g, '')
  return (digits.startsWith('0') && digits.length === 10) ||
    (digits.startsWith('233') && digits.length === 12)
}

export default function SellPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    category: '' as Category | '',
    condition: '' as Condition | '',
    price: '',
    description: '',
    phone: '',
    inStock: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [newId, setNewId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/sell')
  }, [user, authLoading, router])

  const update = (key: string, val: string | boolean) => setForm(p => ({ ...p, [key]: val }))

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
    setImagePreview(URL.createObjectURL(file))
    setError('')
    if (file.size > 500 * 1024) {
      try {
        const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true })
        setImageFile(compressed)
      } catch { setImageFile(file) }
    } else {
      setImageFile(file)
    }
  }

  const profileReady = !!(profile?.name?.trim() && profile?.phone?.trim() && profile?.department?.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    if (!profileReady) { setError('Please complete your profile (name, phone, department) before listing.'); return }
    if (!form.name.trim()) { setError('Item name is required.'); return }
    if (!form.category) { setError('Please select a category.'); return }
    if (!form.condition) { setError('Please select the item condition.'); return }
    if (!form.price || Number(form.price) <= 0) { setError('Please enter a valid price.'); return }
    if (!form.description.trim()) { setError('Please add a description.'); return }

    const rawPhone = form.phone.trim() || profile.phone || ''
    if (rawPhone && !isValidGhanaPhone(rawPhone)) {
      setError('Please enter a valid Ghana number (e.g. 0241234567 or +233241234567).')
      return
    }

    setLoading(true)
    setError('')

    try {
      let imageUrl: string | null = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `products/${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile, { contentType: imageFile.type })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
          imageUrl = publicUrl
        } else {
          console.warn('Image upload failed:', uploadError.message)
        }
      }

      const formattedPhone = rawPhone ? normaliseGhanaPhone(rawPhone) : null

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          category: form.category,
          condition: form.condition,
          imageUrl,
          whatsapp: formattedPhone,
          inStock: form.inStock,
        }),
      })

      if (res.status === 429) { setError("You're creating listings too quickly. Please wait a few minutes."); return }
      if (!res.ok) { const body = await res.json().catch(() => ({})); setError(body.error ?? 'Something went wrong.'); return }

      const data = await res.json()
      setNewId(data?.id ?? null)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return null

  if (success) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8f8f8' }}>
        <div style={{ width: '100%', maxWidth: '480px', border: '3px solid #f59e0b', background: '#fff', boxShadow: '8px 8px 0 #f59e0b', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '28px', color: '#92400e', marginBottom: '12px' }}>
            UNDER REVIEW
          </div>
          <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '8px' }}>
            Your listing has been submitted and is <strong>awaiting admin approval</strong>.
          </p>
          <p style={{ color: '#888', fontSize: '13px', lineHeight: 1.6, marginBottom: '28px' }}>
            Once approved, your item will become visible to all UMaT students. You'll be able to see your listing in My Listings in the meantime.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {newId && (
              <Link href={`/goods/${newId}`} style={{ display: 'block', padding: '14px', background: '#f59e0b', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
                VIEW MY LISTING →
              </Link>
            )}
            <Link
              href="/sell"
              onClick={() => { setSuccess(false); setForm({ name: '', category: '', condition: '', price: '', description: '', phone: '', inStock: true }); setImageFile(null); setImagePreview(null) }}
              style={{ display: 'block', padding: '14px', background: '#fff', color: '#111', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', textDecoration: 'none', border: '2px solid #111' }}
            >
              LIST ANOTHER ITEM
            </Link>
            <Link href="/my-listings" style={{ display: 'block', padding: '12px', color: '#666', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>
              Go to My Listings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>LIST YOUR ITEM</div>
          <p style={{ color: '#888', marginTop: '6px', fontSize: '14px' }}>100% free. No commission. Admin-reviewed before going live.</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '640px' }}>

          {/* Profile incomplete warning */}
          {!profileReady && (
            <div style={{ background: '#fff8e1', border: '2px solid #f59e0b', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>Complete your profile first</div>
                <p style={{ fontSize: '13px', color: '#78350f', margin: '0 0 10px' }}>
                  Sellers must have a full name, phone number, and department set.
                </p>
                <a href="/profile" style={{ display: 'inline-block', padding: '8px 18px', background: '#f59e0b', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', textDecoration: 'none', border: '2px solid #111', letterSpacing: '0.5px' }}>
                  COMPLETE PROFILE →
                </a>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fee2e2', border: '2px solid #ef4444', padding: '12px 16px', marginBottom: '24px', fontSize: '14px', color: '#dc2626', fontWeight: 600, display: 'flex', gap: '8px' }}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Image Upload */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '10px' }}>ITEM PHOTO</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${imagePreview ? '#1B5E20' : '#111'}`,
                  padding: '24px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                  background: imagePreview ? '#f0fdf4' : '#fff', position: 'relative', minHeight: '160px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {imagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={imagePreview} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                      style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📷</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Click to upload a photo</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>JPG, PNG or WebP · Max 5MB</div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display: 'none' }} />
              </div>
            </div>

            {/* Item Name */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>ITEM NAME *</label>
              <input
                type="text" value={form.name} onChange={e => update('name', e.target.value)}
                placeholder="e.g., Dell Laptop XPS 13, Casio Calculator" required
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                onBlur={e => (e.currentTarget.style.borderColor = '#111')}
              />
            </div>

            {/* Category + Condition */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>CATEGORY *</label>
                <select value={form.category} onChange={e => update('category', e.target.value)} required
                  style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>CONDITION *</label>
                <select value={form.condition} onChange={e => update('condition', e.target.value)} required
                  style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="">Select condition</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Price */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>PRICE (GHS) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '15px', color: '#888' }}>₵</span>
                <input
                  type="number" value={form.price} onChange={e => update('price', e.target.value)}
                  placeholder="0" required min="1" step="1"
                  style={{ width: '100%', padding: '13px 16px 13px 36px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#111')}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>DESCRIPTION *</label>
              <textarea
                value={form.description} onChange={e => update('description', e.target.value)}
                placeholder="Describe your item — specs, condition details, what's included, why you're selling." required rows={5}
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                onBlur={e => (e.currentTarget.style.borderColor = '#111')}
              />
            </div>

            {/* In Stock toggle */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>STOCK STATUS</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[true, false].map(val => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => update('inStock', val)}
                    style={{
                      flex: 1, padding: '12px 16px', cursor: 'pointer',
                      fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', letterSpacing: '0.5px',
                      border: '2px solid #111',
                      background: form.inStock === val ? (val ? '#1B5E20' : '#dc2626') : '#fff',
                      color: form.inStock === val ? '#fff' : '#888',
                      boxShadow: form.inStock === val ? '3px 3px 0 #111' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {val ? '✓ IN STOCK' : '✕ OUT OF STOCK'}
                  </button>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                WHATSAPP NUMBER (OPTIONAL)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#888', fontWeight: 700, pointerEvents: 'none' }}>
                  +233
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder={profile?.phone ? profile.phone.replace(/^\+233|^0/, '') : '24 123 4567'}
                  style={{ width: '100%', padding: '13px 16px 13px 56px', border: '2px solid #ddd', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#25D366')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#ddd')}
                />
              </div>
              <p style={{ marginTop: '6px', fontSize: '12px', color: '#888' }}>
                Ghana number — buyers can message you on WhatsApp. Leave blank to use your profile number.
              </p>
            </div>

            {/* Seller Preview */}
            <div style={{ padding: '16px', background: '#f0f0f0', border: '2px solid #ddd', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name ?? ''} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #111' }} />
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                  {(profile?.name ?? user.email ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Listed by {profile?.name ?? 'You'}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{profile?.department ?? 'UMaT Student'}</div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !profileReady}
              style={{
                width: '100%', padding: '18px',
                background: (loading || !profileReady) ? '#888' : '#1B5E20',
                color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '16px',
                border: '2px solid #111', cursor: (loading || !profileReady) ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
                boxShadow: (loading || !profileReady) ? 'none' : '6px 6px 0 #111',
                letterSpacing: '0.5px', transition: 'all 0.2s',
              }}
            >
              {loading ? 'SUBMITTING FOR REVIEW...' : 'SUBMIT LISTING FOR REVIEW →'}
            </button>

            <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
              Listings are reviewed by admin before going live. By listing, you agree to our{' '}
              <Link href="/about" style={{ color: '#5d3fd3', fontWeight: 700 }}>community guidelines</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
