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
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [newId, setNewId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/sell')
    }
  }, [user, authLoading, router])

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    // Show preview immediately from original
    setImagePreview(URL.createObjectURL(file))
    setError('')

    // Compress to under 500KB if needed — keeps uploads fast and storage lean
    if (file.size > 500 * 1024) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        })
        setImageFile(compressed)
      } catch {
        setImageFile(file) // fall back to original if compression fails
      }
    } else {
      setImageFile(file)
    }
  }

  // Sellers/providers must have name + phone + department before listing
  const profileReady = !!(profile?.name?.trim() && profile?.phone?.trim() && profile?.department?.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    if (!profileReady) {
      setError('Please complete your profile (name, phone, department) before listing.')
      return
    }

    if (!form.name.trim()) { setError('Item name is required.'); return }
    if (!form.category) { setError('Please select a category.'); return }
    if (!form.condition) { setError('Please select the item condition.'); return }
    if (!form.price || Number(form.price) <= 0) { setError('Please enter a valid price.'); return }
    if (!form.description.trim()) { setError('Please add a description.'); return }

    setLoading(true)
    setError('')

    try {
      let imageUrl: string | null = null

      // Upload image if provided
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `products/${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile, { contentType: imageFile.type })

        if (uploadError) {
          console.warn('Image upload failed:', uploadError.message)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(path)
          imageUrl = publicUrl
        }
      }

      // Insert via API route (server-side rate limiting applied)
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
          whatsapp: form.phone.trim() || profile.phone || null,
        }),
      })

      if (res.status === 429) {
        setError('You\'re creating listings too quickly. Please wait a few minutes.')
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

  if (!user) return null

  if (success) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8f8f8' }}>
        <div style={{ width: '100%', maxWidth: '480px', border: '3px solid #1B5E20', background: '#fff', boxShadow: '8px 8px 0 #1B5E20', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '28px', color: '#1B5E20', marginBottom: '12px' }}>
            ITEM LISTED!
          </div>
          <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '28px' }}>
            Your item has been listed successfully. Other students can now find it and contact you.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {newId && (
              <Link href={`/goods/${newId}`} style={{ display: 'block', padding: '14px', background: '#1B5E20', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
                VIEW MY LISTING →
              </Link>
            )}
            <Link href="/sell" onClick={() => { setSuccess(false); setForm({ name: '', category: '', condition: '', price: '', description: '', phone: '' }); setImageFile(null); setImagePreview(null) }}
              style={{ display: 'block', padding: '14px', background: '#fff', color: '#111', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', textDecoration: 'none', border: '2px solid #111' }}>
              LIST ANOTHER ITEM
            </Link>
            <Link href="/dashboard" style={{ display: 'block', padding: '12px', color: '#666', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>
              Go to Dashboard
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
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>
            LIST YOUR ITEM
          </div>
          <p style={{ color: '#888', marginTop: '6px', fontSize: '14px' }}>
            100% free. No commission. No hidden fees. List in under 2 minutes.
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
                  To list items, sellers must have a full name, phone number, and department set on their profile.
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

            {/* Image Upload */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '10px' }}>
                ITEM PHOTO
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${imagePreview ? '#1B5E20' : '#111'}`,
                  padding: '24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  background: imagePreview ? '#f0fdf4' : '#fff',
                  position: 'relative',
                  minHeight: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={e => !imagePreview && ((e.currentTarget as HTMLElement).style.background = '#f8f8f8')}
                onMouseLeave={e => !imagePreview && ((e.currentTarget as HTMLElement).style.background = '#fff')}
              >
                {imagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={imagePreview} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                      style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📷</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Click to upload a photo</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>JPG, PNG or WebP · Max 5MB</div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Item Name */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                ITEM NAME *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="e.g., Dell Laptop XPS 13, Casio Calculator"
                required
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                onBlur={e => (e.currentTarget.style.borderColor = '#111')}
              />
            </div>

            {/* Category + Condition */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                  CATEGORY *
                </label>
                <select
                  value={form.category}
                  onChange={e => update('category', e.target.value)}
                  required
                  style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                  CONDITION *
                </label>
                <select
                  value={form.condition}
                  onChange={e => update('condition', e.target.value)}
                  required
                  style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
                >
                  <option value="">Select condition</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Price */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                PRICE (GHS) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '15px', color: '#888' }}>₵</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => update('price', e.target.value)}
                  placeholder="0"
                  required
                  min="1"
                  step="1"
                  style={{ width: '100%', padding: '13px 16px 13px 36px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#111')}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                DESCRIPTION *
              </label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe your item — mention specs, any wear or damage, why you're selling, what's included (e.g., charger, box)."
                required
                rows={5}
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', transition: 'border-color 0.15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                onBlur={e => (e.currentTarget.style.borderColor = '#111')}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                WHATSAPP NUMBER (OPTIONAL)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder={profile?.phone ?? '+233 XX XXX XXXX'}
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #ddd', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
              />
              <p style={{ marginTop: '6px', fontSize: '12px', color: '#888' }}>
                Buyers can contact you via WhatsApp. Leave blank to use your profile phone.
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
              {loading ? 'LISTING YOUR ITEM...' : 'LIST ITEM FOR FREE →'}
            </button>

            <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
              By listing, you agree to our{' '}
              <Link href="/about" style={{ color: '#5d3fd3', fontWeight: 700 }}>community guidelines</Link>.
              Your listing is visible to all UMaT students.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
