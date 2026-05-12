"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import SectionWrapper from '@/components/ui/SectionWrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProfileIncompleteWarning, ErrorBanner, FormField, BrutalTextarea, ImageUploadZone, AdditionalPhotosGrid, GhanaPhoneInput } from '@/components/shared/FormPrimitives'

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
    (digits.startsWith('233') && digits.length === 12) ||
    digits.length === 9  // user typed just the 9 digits after the +233 prefix
}

export default function SellPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const additionalFileInputRef = useRef<HTMLInputElement>(null)

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
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [newId, setNewId] = useState<string | null>(null)
  const [subStatus, setSubStatus] = useState<'loading' | 'active' | 'none'>('loading')

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/sell')
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
      setError('Please enter a valid Ghana number (e.g. 241234567 — the 9 digits after +233).')
      return
    }

    setLoading(true)
    setError('')

    try {
      let imageUrl: string | null = null
      if (imageFile) {
        imageUrl = await uploadImageToR2(imageFile, 'products')
        if (!imageUrl) console.warn('Image upload to R2 failed — listing created without image')
      }

      const additionalImageUrls: string[] = []
      for (const file of additionalFiles) {
        const url = await uploadImageToR2(file, 'products')
        if (url) additionalImageUrls.push(url)
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
          additionalImages: additionalImageUrls,
        }),
      })

      if (res.status === 429) { setError("You're creating listings too quickly. Please wait a few minutes."); return }
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}))
        if (body.code === 'SUBSCRIPTION_REQUIRED') { router.push('/subscribe'); return }
        setError(body.error ?? 'Permission denied.'); return
      }
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
        <div style={{ fontFamily: '"Syne", sans-serif', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: '"Syne", sans-serif', color: '#888' }}>Loading...</div>
    </div>
  )

  if (subStatus === 'loading') return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: '"Syne", sans-serif', color: '#888' }}>Loading...</div>
    </div>
  )

  if (subStatus === 'none') return (
    <>
      <div style={{ background: '#FAFAF8', borderBottom: '1px solid #E8E5E0', padding: '32px 20px' }}>
        <div className="container">
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', letterSpacing: '-0.5px', color: '#1A1A1A' }}>List Your Item</div>
        </div>
      </div>
      <SectionWrapper className="bg-[#f8f8f8]">
        <div style={{ maxWidth: '520px', border: '1px solid #E8E5E0', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ background: '#E8F5E9', padding: '28px 32px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', color: '#1A1A1A' }}>Seller Subscription Required</div>
              <div style={{ fontSize: '13px', color: '#2E7D32', fontFamily: '"Plus Jakarta Sans", sans-serif', marginTop: '2px' }}>GHS 20/month · Cancel anytime</div>
            </div>
          </div>
          <div style={{ padding: '28px 32px' }}>
            <p style={{ color: '#6B6660', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Campus Connect is free for buyers. To list goods and services, sellers pay a small <strong style={{ color: '#1A1A1A' }}>GHS 20/month</strong> platform fee — keeping the platform running across all 43 Ghana universities.
            </p>
            {['Unlimited goods listings', 'Unlimited service listings', 'Admin-reviewed for quality', 'Keep the platform alive for 300k+ students'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1A1A1A' }}>{f}</span>
              </div>
            ))}
            <div style={{ marginTop: '24px' }}>
              <Link href="/subscribe" style={{ display: 'block', padding: '16px', background: '#1B5E20', color: '#fff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '15px', textDecoration: 'none', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(27,94,32,0.3)' }}>
                Subscribe — GHS 20/month →
              </Link>
              <p style={{ marginTop: '12px', fontSize: '12px', color: '#9A9590', textAlign: 'center', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Pay via MTN MoMo · Vodafone Cash · AirtelTigo · Card
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </>
  )

  if (success) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#FAFAF8' }}>
        <div style={{ width: '100%', maxWidth: '480px', background: '#fff', border: '1px solid #E8E5E0', borderRadius: '20px', padding: '40px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#f59e0b' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', color: '#1A1A1A', marginBottom: '10px' }}>
            Under Review
          </div>
          <p style={{ color: '#6B6660', lineHeight: 1.7, marginBottom: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px' }}>
            Your listing has been submitted and is <strong style={{ color: '#1A1A1A' }}>awaiting admin approval</strong>.
          </p>
          <p style={{ color: '#9A9590', fontSize: '13px', lineHeight: 1.6, marginBottom: '28px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Once approved, your item will become visible to all campus students. You'll be able to see it in My Listings in the meantime.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {newId && (
              <Link href={`/goods/${newId}`} style={{ display: 'block', padding: '14px', background: '#1B5E20', color: '#fff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none', borderRadius: '10px' }}>
                View My Listing →
              </Link>
            )}
            <Link
              href="/sell"
              onClick={() => { setSuccess(false); setForm({ name: '', category: '', condition: '', price: '', description: '', phone: '', inStock: true }); setImageFile(null); setImagePreview(null); setAdditionalFiles([]); setAdditionalPreviews([]) }}
              style={{ display: 'block', padding: '14px', background: '#F3F2EF', color: '#1A1A1A', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none', borderRadius: '10px' }}
            >
              List Another Item
            </Link>
            <Link href="/my-listings" style={{ display: 'block', padding: '10px', color: '#9A9590', fontWeight: 600, textDecoration: 'none', fontSize: '13px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Go to My Listings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div style={{ background: '#FAFAF8', borderBottom: '1px solid #E8E5E0', padding: '32px 20px' }}>
        <div className="container">
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', letterSpacing: '-0.5px', color: '#1A1A1A' }}>List Your Item</div>
          <p style={{ color: '#9A9590', marginTop: '6px', fontSize: '14px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>100% free. No commission. Admin-reviewed before going live.</p>
        </div>
      </div>

      <SectionWrapper className="bg-[#f8f8f8]">
        <div style={{ maxWidth: '640px' }}>

          {!profileReady && <ProfileIncompleteWarning message="Sellers must have a full name, phone number, and department set." />}
          <ErrorBanner error={error} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Image Upload */}
            <FormField label="ITEM PHOTO" labelSpacing="10px">
              <ImageUploadZone
                preview={imagePreview}
                fileRef={fileInputRef}
                onClear={() => { setImageFile(null); setImagePreview(null) }}
                onChange={handleImageChange}
              />
            </FormField>

            {/* Additional Photos */}
            {imagePreview && (
              <FormField label="ADDITIONAL PHOTOS" hint="(optional, up to 4 more)" labelSpacing="10px">
                <AdditionalPhotosGrid
                  previews={additionalPreviews}
                  onRemove={idx => { setAdditionalFiles(p => p.filter((_, i) => i !== idx)); setAdditionalPreviews(p => p.filter((_, i) => i !== idx)) }}
                  onAddClick={() => additionalFileInputRef.current?.click()}
                  fileRef={additionalFileInputRef}
                  onChange={handleAdditionalImagesChange}
                />
              </FormField>
            )}

            {/* Item Name */}
            <FormField label="ITEM NAME *">
              <Input
                type="text" value={form.name} onChange={e => update('name', e.target.value)}
                placeholder="e.g., Dell Laptop XPS 13, Casio Calculator" required
                className="text-[15px] focus-visible:border-[#1B5E20]"
              />
            </FormField>

            {/* Category + Condition */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="CATEGORY *">
                <select value={form.category} onChange={e => update('category', e.target.value)} required
                  style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="CONDITION *">
                <select value={form.condition} onChange={e => update('condition', e.target.value)} required
                  style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="">Select condition</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
            </div>

            {/* Price */}
            <FormField label="PRICE (GHS) *">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '15px', color: '#888' }}>₵</span>
                <Input
                  type="number" value={form.price} onChange={e => update('price', e.target.value)}
                  placeholder="0" required min="1" step="1"
                  className="pl-9 text-[15px] font-bold focus-visible:border-[#1B5E20]"
                />
              </div>
            </FormField>

            {/* Description */}
            <FormField label="DESCRIPTION *">
              <BrutalTextarea
                value={form.description} onChange={e => update('description', e.target.value)}
                placeholder="Describe your item — specs, condition details, what's included, why you're selling." required rows={5}
                focusColor="#1B5E20"
              />
            </FormField>

            {/* In Stock toggle */}
            <FormField label="STOCK STATUS">
              <div style={{ display: 'flex', gap: '10px' }}>
                {[true, false].map(val => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => update('inStock', val)}
                    style={{
                      flex: 1, padding: '12px 16px', cursor: 'pointer',
                      fontFamily: '"Syne", sans-serif', fontSize: '12px', letterSpacing: '0.5px',
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
            </FormField>

            {/* WhatsApp */}
            <FormField label="WHATSAPP NUMBER (OPTIONAL)" hint="Ghana number — buyers can message you on WhatsApp. Leave blank to use your profile number.">
              <GhanaPhoneInput
                value={form.phone}
                onChange={e => update('phone', e.target.value.replace(/\D/g, ''))}
                placeholder={profile?.phone ? profile.phone.replace(/^\+?233|^0/, '') : '241234567'}
              />
            </FormField>

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
                <div style={{ fontSize: '12px', color: '#888' }}>{profile?.department ?? 'Campus Student'}</div>
              </div>
            </div>

            <Button
              type="submit"
              variant="brutal-green"
              disabled={loading || !profileReady}
              className="w-full h-auto py-[18px] text-base"
            >
              {loading ? 'SUBMITTING FOR REVIEW...' : 'SUBMIT LISTING FOR REVIEW →'}
            </Button>

            <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
              Listings are reviewed by admin before going live. By listing, you agree to our{' '}
              <Link href="/about" style={{ color: '#5d3fd3', fontWeight: 700 }}>community guidelines</Link>.
            </p>
          </form>
        </div>
      </SectionWrapper>
    </>
  )
}
