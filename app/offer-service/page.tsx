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
      <div style={{ background: '#1B5E20', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>OFFER A SERVICE</div>
        </div>
      </div>
      <SectionWrapper className="bg-[#f8f8f8]">
        <div style={{ maxWidth: '520px', border: '3px solid #1B5E20', background: '#fff', boxShadow: '8px 8px 0 #1B5E20', padding: '40px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: '#1B5E20' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '26px', letterSpacing: '-0.5px', marginBottom: '14px' }}>
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
            <Link href="/subscribe" style={{ display: 'block', padding: '18px', background: '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '15px', textDecoration: 'none', border: '2px solid #111', boxShadow: '6px 6px 0 #111', textAlign: 'center', letterSpacing: '0.5px' }}>
              SUBSCRIBE — GHS 20/MONTH →
            </Link>
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
              Pay via MTN MoMo · Vodafone Cash · AirtelTigo · Card
            </p>
          </div>
        </div>
      </SectionWrapper>
    </>
  )

  if (success) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8f8f8' }}>
        <div style={{ width: '100%', maxWidth: '480px', border: '3px solid #1B5E20', background: '#fff', boxShadow: '8px 8px 0 #1B5E20', padding: '40px', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: '#1B5E20' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', color: '#1B5E20', marginBottom: '12px' }}>
            SERVICE LISTED!
          </div>
          <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '28px' }}>
            Your service is live. Students can now find and book you on Campus Connect.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {newId && (
              <Link href={`/services/${newId}`} style={{ display: 'block', padding: '14px', background: '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '14px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
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
    <>
      {/* Header */}
      <div style={{ background: '#1B5E20', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>
            OFFER A SERVICE
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '6px', fontSize: '14px' }}>
            Share your skills with campus students. Build your reputation. Grow your income.
          </p>
        </div>
      </div>

      <SectionWrapper className="bg-[#f8f8f8]">
        <div style={{ maxWidth: '640px' }}>

          {!profileReady && <ProfileIncompleteWarning message="Service providers must have a full name, phone number, and department before listing." />}
          <ErrorBanner error={error} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Image */}
            <FormField label="SERVICE PHOTO (OPTIONAL)" labelSpacing="10px">
              <ImageUploadZone
                preview={imagePreview}
                fileRef={fileInputRef}
                onClear={() => { setImageFile(null); setImagePreview(null) }}
                onChange={handleImageChange}
                emptyLabel="Add a photo of your work"
                emptySubtext="JPG, PNG · Max 5MB"
                emptyIcon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                minHeight={140}
                previewMaxHeight={180}
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

            {/* Service Name */}
            <FormField label="SERVICE NAME *">
              <Input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="e.g., Professional Haircut & Styling, Mathematics Tutoring"
                required
                className="text-[15px] focus-visible:border-[#1B5E20]"
              />
            </FormField>

            {/* Category */}
            <FormField label="CATEGORY *">
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
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      transition: '0.15s',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Rate */}
            <FormField label="RATE / PRICING *">
              <Input
                type="text"
                value={form.rate}
                onChange={e => update('rate', e.target.value)}
                placeholder="e.g., GHS 50–80/hr · GHS 30–50 per cut · GHS 500 per event"
                required
                className="text-[15px] focus-visible:border-[#1B5E20]"
              />
            </FormField>

            {/* Availability */}
            <FormField label="AVAILABILITY *">
              <Input
                type="text"
                value={form.availability}
                onChange={e => update('availability', e.target.value)}
                placeholder="e.g., Mon–Sat 9AM–6PM · Weekends only · Book 24hrs ahead"
                required
                className="text-[15px] focus-visible:border-[#1B5E20]"
              />
            </FormField>

            {/* Description */}
            <FormField label="DESCRIPTION *">
              <BrutalTextarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe your service — your experience, what's included, why students should choose you."
                required
                rows={5}
                focusColor="#1B5E20"
              />
            </FormField>

            {/* WhatsApp */}
            <FormField label="WHATSAPP NUMBER (OPTIONAL)" hint="Ghana number — buyers can contact you on WhatsApp. Leave blank to use your profile number.">
              <GhanaPhoneInput
                value={form.whatsapp}
                onChange={e => update('whatsapp', e.target.value.replace(/\D/g, ''))}
                className="focus-visible:border-[#1B5E20]"
              />
            </FormField>

            <Button
              type="submit"
              variant="brutal-green"
              disabled={loading}
              className="w-full h-auto py-[18px] text-base"
            >
              {loading ? 'POSTING SERVICE...' : 'POST SERVICE FOR FREE →'}
            </Button>

            <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
              By posting, you agree to our <Link href="/about" style={{ color: '#5d3fd3', fontWeight: 700 }}>community guidelines</Link>.
            </p>
          </form>
        </div>
      </SectionWrapper>
    </>
  )
}
