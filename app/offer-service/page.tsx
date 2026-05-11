"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

async function uploadImageToR2(file: File, folder: string): Promise<string | null> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: file.type, folder, fileSize: file.size }),
    })
    if (!res.ok) return null
    const { uploadUrl, publicUrl } = await res.json()
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    return put.ok ? publicUrl : null
  } catch {
    return null
  }
}

const SERVICE_CATEGORIES = ['Barbing', 'Tutoring', 'Photography', 'Laundry', 'Tech Repair', 'Design', 'Other'] as const

export default function OfferServicePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const additionalFileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    category: '',
    rate: '',
    description: '',
    availability: '',
    whatsapp: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [newId, setNewId] = useState<string | null>(null)
  const [subStatus, setSubStatus] = useState<'loading' | 'active' | 'none'>('loading')

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/offer-service')
  }, [user, authLoading, router])

  useEffect(() => {
    if (authLoading || !user) return
    supabase
      .from('profiles')
      .select('subscription_expires_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const exp = (data as any)?.subscription_expires_at
        setSubStatus(exp && new Date(exp) > new Date() ? 'active' : 'none')
      })
  }, [user, authLoading])

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
    setImagePreview(URL.createObjectURL(file))
    setError('')

    if (file.size > 500 * 1024) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        })
        setImageFile(compressed)
      } catch {
        setImageFile(file)
      }
    } else {
      setImageFile(file)
    }
  }

  const handleAdditionalImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = 4 - additionalFiles.length
    const toAdd = files.slice(0, remaining)
    const newFiles: File[] = []
    const newPreviews: string[] = []
    for (const file of toAdd) {
      if (file.size > 5 * 1024 * 1024) continue
      newPreviews.push(URL.createObjectURL(file))
      if (file.size > 500 * 1024) {
        try {
          const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true })
          newFiles.push(compressed)
        } catch { newFiles.push(file) }
      } else {
        newFiles.push(file)
      }
    }
    setAdditionalFiles(prev => [...prev, ...newFiles])
    setAdditionalPreviews(prev => [...prev, ...newPreviews])
    e.target.value = ''
  }

  // Providers must have name + phone + department before listing
  const profileReady = !!(profile?.name?.trim() && profile?.phone?.trim() && profile?.department?.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    if (!profileReady) {
      setError('Please complete your profile (name, phone, department) before listing a service.')
      return
    }

    if (!form.name.trim()) { setError('Service name is required.'); return }
    if (!form.category) { setError('Please select a category.'); return }
    if (!form.rate.trim()) { setError('Please enter your rate/pricing.'); return }
    if (!form.description.trim()) { setError('Please add a description.'); return }
    if (!form.availability.trim()) { setError('Please enter your availability.'); return }

    setLoading(true)
    setError('')

    try {
      let imageUrl: string | null = null
      if (imageFile) {
        imageUrl = await uploadImageToR2(imageFile, 'services')
        if (!imageUrl) console.warn('Image upload to R2 failed — service created without image')
      }

      const additionalImageUrls: string[] = []
      for (const file of additionalFiles) {
        const url = await uploadImageToR2(file, 'services')
        if (url) additionalImageUrls.push(url)
      }

      // Insert via API route (server-side rate limiting applied)
      const res = await fetch('/api/service-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          rate: form.rate.trim(),
          availability: form.availability.trim(),
          imageUrl,
          whatsapp: form.whatsapp.trim() ? '+233' + form.whatsapp.replace(/\D/g, '') : (profile.phone ?? null),
          additionalImages: additionalImageUrls,
        }),
      })

      if (res.status === 429) {
        setError('You\'re creating services too quickly. Please wait a few minutes.')
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Something went wrong. Please try again.')
        return
      }

      const data = await res.json()
      setNewId(data?.id ?? null)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
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

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
    </div>
  )

  if (subStatus === 'loading') return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
    </div>
  )

  if (subStatus === 'none') return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>
      <div style={{ background: '#1B5E20', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>OFFER A SERVICE</div>
        </div>
      </div>
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '520px', border: '3px solid #1B5E20', background: '#fff', boxShadow: '8px 8px 0 #1B5E20', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</div>
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '26px', letterSpacing: '-0.5px', marginBottom: '14px' }}>
            SELLER SUBSCRIPTION REQUIRED
          </div>
          <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
            To offer services on Campus Connect, activate your seller account for <strong>GHS 20/month</strong>. This covers tutoring, photography, laundry, barbing, and any other service you want to offer to campus students.
          </p>
          {['Unlimited service listings', 'Unlimited goods listings', 'Admin-reviewed for quality', 'Keep the platform alive for 300k+ students'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ color: '#1B5E20', fontWeight: 900, fontSize: '16px' }}>✓</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{f}</span>
            </div>
          ))}
          <div style={{ marginTop: '28px' }}>
            <Link href="/subscribe" style={{ display: 'block', padding: '18px', background: '#1B5E20', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '15px', textDecoration: 'none', border: '2px solid #111', boxShadow: '6px 6px 0 #111', textAlign: 'center', letterSpacing: '0.5px' }}>
              SUBSCRIBE — GHS 20/MONTH →
            </Link>
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
              Pay via MTN MoMo · Vodafone Cash · AirtelTigo · Card
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  if (success) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8f8f8' }}>
        <div style={{ width: '100%', maxWidth: '480px', border: '3px solid #1B5E20', background: '#fff', boxShadow: '8px 8px 0 #1B5E20', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛠️</div>
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '28px', color: '#1B5E20', marginBottom: '12px' }}>
            SERVICE LISTED!
          </div>
          <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '28px' }}>
            Your service is live. Students can now find and book you on Campus Connect.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {newId && (
              <Link href={`/services/${newId}`} style={{ display: 'block', padding: '14px', background: '#1B5E20', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
                VIEW MY SERVICE →
              </Link>
            )}
            <Link href="/my-listings" style={{ display: 'block', padding: '12px', color: '#666', fontWeight: 600, textDecoration: 'none', fontSize: '14px', border: '1px solid #eee' }}>
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
      <div style={{ background: '#1B5E20', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>
            OFFER A SERVICE
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '6px', fontSize: '14px' }}>
            Share your skills with campus students. Build your reputation. Grow your income.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '640px' }}>

          {/* Profile incomplete warning */}
          {!profileReady && (
            <div style={{ background: '#fff8e1', border: '2px solid #f59e0b', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>
                  Complete your profile first
                </div>
                <p style={{ fontSize: '13px', color: '#78350f', margin: '0 0 10px' }}>
                  Service providers must have a full name, phone number, and department before listing.
                </p>
                <a
                  href="/profile"
                  style={{ display: 'inline-block', padding: '8px 18px', background: '#f59e0b', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', textDecoration: 'none', border: '2px solid #111', letterSpacing: '0.5px' }}
                >
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

            {/* Image */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '10px' }}>
                SERVICE PHOTO (OPTIONAL)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${imagePreview ? '#1B5E20' : '#111'}`, padding: '24px', cursor: 'pointer', textAlign: 'center', background: imagePreview ? '#f0fdf4' : '#fff', minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {imagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={imagePreview} alt="Preview" style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                    <button type="button" onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>✕</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Add a photo of your work</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>JPG, PNG · Max 5MB</div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display: 'none' }} />
              </div>
            </div>

            {/* Additional Photos */}
            {imagePreview && (
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '10px' }}>
                  ADDITIONAL PHOTOS <span style={{ fontWeight: 400, color: '#888' }}>(optional, up to 4 more)</span>
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {additionalPreviews.map((preview, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                      <img src={preview} alt={`Additional ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', border: '2px solid #111', display: 'block' }} />
                      <button
                        type="button"
                        onClick={() => { setAdditionalFiles(p => p.filter((_, i) => i !== idx)); setAdditionalPreviews(p => p.filter((_, i) => i !== idx)) }}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                      >✕</button>
                    </div>
                  ))}
                  {additionalPreviews.length < 4 && (
                    <button
                      type="button"
                      onClick={() => additionalFileInputRef.current?.click()}
                      style={{ width: '80px', height: '80px', border: '2px dashed #ddd', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#888', flexShrink: 0 }}
                    >
                      <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>ADD</span>
                    </button>
                  )}
                  <input ref={additionalFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleAdditionalImagesChange} style={{ display: 'none' }} />
                </div>
              </div>
            )}

            {/* Service Name */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>SERVICE NAME *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="e.g., Professional Haircut & Styling, Mathematics Tutoring"
                required
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                onBlur={e => (e.currentTarget.style.borderColor = '#111')}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>CATEGORY *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {SERVICE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => update('category', cat)}
                    style={{
                      padding: '10px 6px', border: '2px solid',
                      borderColor: form.category === cat ? '#1B5E20' : '#ddd',
                      background: form.category === cat ? '#e8f5e9' : '#fff',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                      color: form.category === cat ? '#1B5E20' : '#666',
                      fontFamily: '"Space Grotesk", sans-serif',
                      transition: '0.15s',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>RATE / PRICING *</label>
              <input
                type="text"
                value={form.rate}
                onChange={e => update('rate', e.target.value)}
                placeholder="e.g., GHS 50–80/hr · GHS 30–50 per cut · GHS 500 per event"
                required
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                onBlur={e => (e.currentTarget.style.borderColor = '#111')}
              />
            </div>

            {/* Availability */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>AVAILABILITY *</label>
              <input
                type="text"
                value={form.availability}
                onChange={e => update('availability', e.target.value)}
                placeholder="e.g., Mon–Sat 9AM–6PM · Weekends only · Book 24hrs ahead"
                required
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                onBlur={e => (e.currentTarget.style.borderColor = '#111')}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>DESCRIPTION *</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe your service — your experience, what's included, why students should choose you."
                required
                rows={5}
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', transition: 'border-color 0.15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                onBlur={e => (e.currentTarget.style.borderColor = '#111')}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>WHATSAPP NUMBER (OPTIONAL)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#555', fontWeight: 700, pointerEvents: 'none', userSelect: 'none' }}>
                  +233
                </span>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => update('whatsapp', e.target.value.replace(/\D/g, ''))}
                  placeholder="241234567"
                  maxLength={9}
                  style={{ width: '100%', padding: '13px 16px 13px 58px', border: '2px solid #ddd', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#ddd')}
                />
              </div>
              <p style={{ marginTop: '6px', fontSize: '12px', color: '#888' }}>
                Ghana number — buyers can contact you on WhatsApp. Leave blank to use your profile number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '18px',
                background: loading ? '#888' : '#1B5E20',
                color: '#fff',
                fontFamily: '"Archivo Black", sans-serif', fontSize: '16px',
                border: '2px solid #111',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
                boxShadow: loading ? 'none' : '6px 6px 0 #111',
                letterSpacing: '0.5px',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'POSTING SERVICE...' : 'POST SERVICE FOR FREE →'}
            </button>

            <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
              By posting, you agree to our <Link href="/about" style={{ color: '#5d3fd3', fontWeight: 700 }}>community guidelines</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
