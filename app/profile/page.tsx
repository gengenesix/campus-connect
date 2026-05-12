"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

async function uploadAvatarToR2(file: File): Promise<string | null> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: file.type, folder: 'avatars', fileSize: file.size }),
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
import { FACULTIES, CLASS_YEARS } from '@/lib/umat-data'
import { useHostels } from '@/lib/useHostels'
import SectionWrapper from '@/components/ui/SectionWrapper'
import UniversityPicker from '@/components/UniversityPicker'
import { GHANA_UNIVERSITIES, type GhanaUniversity } from '@/lib/ghana-universities'

export default function ProfilePage() {
  const { user, profile, loading, updateProfile, signOut } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hostels = useHostels()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarHover, setAvatarHover] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    department: '',
    course: '',
    class_year: '',
    hostel: '',
    phone: '',
    bio: '',
    role: '',
    universitySlug: '',
  })
  const [selectedUni, setSelectedUni] = useState<GhanaUniversity | null>(null)

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    setDeleteError(null)
    try {
      // Soft-delete all listings first
      await Promise.all([
        supabase.from('products').update({ status: 'deleted' }).eq('seller_id', user!.id),
        supabase.from('services').update({ status: 'deleted' }).eq('provider_id', user!.id),
      ])
      // Call admin API to delete the auth user
      const res = await fetch('/api/auth/delete-account', { method: 'POST' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to delete account')
      }
      await signOut()
      router.push('/?deleted=1')
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  // University email verification state
  const [uniEmail, setUniEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [emailStep, setEmailStep] = useState<'idle' | 'sent' | 'verified'>('idle')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [verifiedUniEmail, setVerifiedUniEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/profile')
  }, [user, loading, router])

  useEffect(() => {
    if (profile) {
      // Resolve slug from university_id for the picker
      let uniSlug = ''
      let uniObj: GhanaUniversity | null = null
      if (profile.university_id) {
        // We store slug in profile.university_id... actually we store UUID.
        // But we can look it up from the supabase universities table OR from
        // the local ghana-universities.ts list by matching what's stored.
        // For now: the profile has university_id (UUID), but the picker needs slug.
        // We'll rely on a separate fetch below.
      }
      setForm({
        name: profile.name ?? '',
        department: profile.department ?? '',
        course: profile.course ?? '',
        class_year: profile.class_year ?? '',
        hostel: profile.hostel ?? '',
        phone: profile.phone?.replace(/^\+?233|^0/, '') ?? '',
        bio: profile.bio ?? '',
        role: profile.role ?? 'buyer',
        universitySlug: uniSlug,
      })
      setSelectedUni(uniObj)
    }
  }, [profile])

  // Resolve university slug from ID (after profile loads)
  useEffect(() => {
    if (!profile?.university_id) return
    supabase
      .from('universities')
      .select('slug')
      .eq('id', profile.university_id)
      .single()
      .then(({ data }) => {
        if (data?.slug) {
          const uni = GHANA_UNIVERSITIES.find(u => u.slug === data.slug) ?? null
          setForm(p => ({ ...p, universitySlug: data.slug }))
          setSelectedUni(uni)
        }
      })
  }, [profile?.university_id])

  // Load university email verification status
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('university_email, university_email_verified')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.university_email_verified && data.university_email) {
          setVerifiedUniEmail(data.university_email)
          setEmailStep('verified')
        } else if (data?.university_email) {
          setUniEmail(data.university_email)
        }
      })
  }, [user])

  const handleSendOtp = async () => {
    if (!uniEmail.toLowerCase().endsWith('.edu.gh')) {
      setEmailMsg('Enter a valid .edu.gh university email address')
      return
    }
    setEmailLoading(true)
    setEmailMsg('')
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: uniEmail }),
      })
      const data = await res.json()
      if (!res.ok) { setEmailMsg(data.error ?? 'Failed to send code'); return }
      setEmailStep('sent')
      setEmailMsg('Code sent! Check your university inbox.')
    } catch {
      setEmailMsg('Network error. Try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleConfirmOtp = async () => {
    if (otpCode.length !== 6) { setEmailMsg('Enter the full 6-digit code'); return }
    setEmailLoading(true)
    setEmailMsg('')
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', email: uniEmail, otp: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) { setEmailMsg(data.error ?? 'Verification failed'); return }
      setEmailStep('verified')
      setVerifiedUniEmail(uniEmail)
      setEmailMsg('')
    } catch {
      setEmailMsg('Network error. Try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) { setSaveMsg('Image must be under 5MB'); return }

    // Show local preview immediately — no waiting for upload
    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)
    setUploadingAvatar(true)
    setSaveMsg('')

    try {
      // Compress avatar to under 500KB before upload
      let fileToUpload = file
      if (file.size > 500 * 1024) {
        try {
          fileToUpload = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          })
        } catch {
          fileToUpload = file // fall back to original
        }
      }

      const publicUrl = await uploadAvatarToR2(fileToUpload)

      if (!publicUrl) {
        setAvatarPreview(null)
        setSaveMsg('Upload failed. Please try again.')
        return
      }

      // Cache-busting param ensures browser reloads the new avatar
      const urlWithBust = `${publicUrl}?t=${Date.now()}`

      const { error } = await updateProfile({ avatar_url: urlWithBust } as any)
      if (error) {
        setAvatarPreview(null)
        setSaveMsg('Photo uploaded but profile update failed. Try saving again.')
      } else {
        setAvatarPreview(null) // profile state now has the real URL
        setSaveMsg('Profile photo updated!')
      }
    } finally {
      setUploadingAvatar(false)
      setTimeout(() => setSaveMsg(''), 5000)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setSaveMsg('Full name is required.'); return }
    setSaving(true)
    setSaveMsg('')

    // Safety: if the save hangs (slow connection / paused DB), unblock UI after 20s
    const saveGuard = setTimeout(() => {
      setSaving(false)
      setSaveMsg('Save timed out — check your internet connection and try again.')
    }, 20000)

    try {
      const roleToSave = form.role && form.role !== 'admin' ? form.role : (profile?.role ?? 'buyer')

      // Resolve university_id if slug changed
      let universityId: string | undefined = undefined
      if (form.universitySlug) {
        const { data: uniRow } = await supabase
          .from('universities')
          .select('id')
          .eq('slug', form.universitySlug)
          .single()
        if (uniRow?.id) universityId = uniRow.id
      }

      const { error } = await updateProfile({
        name: form.name.trim(),
        department: form.department || null,
        course: form.course || null,
        class_year: form.class_year || null,
        hostel: form.hostel || null,
        phone: form.phone ? '+233' + form.phone.replace(/\D/g, '') : null,
        bio: form.bio || null,
        role: roleToSave,
        ...(universityId !== undefined ? { university_id: universityId } : {}),
      } as any)

      if (error) {
        console.error('Profile save error:', error)
        const friendly = error.includes('row-level security') || error.includes('policy') || error.includes('RLS')
          ? 'Unable to save profile. Please sign out and sign back in, then try again.'
          : error.includes('network') || error.includes('fetch') || error.includes('Failed')
          ? 'Network error — check your connection and try again.'
          : 'Could not save your profile. Please try again.'
        setSaveMsg(friendly)
      } else {
        setEditing(false)
        setSaveMsg('Profile updated successfully!')
      }
    } catch (err: any) {
      setSaveMsg(`Unexpected error: ${err?.message ?? 'Please try again.'}`)
    } finally {
      clearTimeout(saveGuard)
      setSaving(false)
    }
    setTimeout(() => setSaveMsg(''), 5000)
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  // Profile completeness calculation
  const completenessFields = [
    { label: 'Full Name', value: profile?.name, weight: 20 },
    { label: 'Phone/WhatsApp', value: profile?.phone, weight: 20 },
    { label: 'Department', value: profile?.department, weight: 15 },
    { label: 'Profile Photo', value: profile?.avatar_url, weight: 15 },
    { label: 'Programme/Course', value: profile?.course, weight: 10 },
    { label: 'Year/Level', value: profile?.class_year, weight: 10 },
    { label: 'Hostel/Location', value: profile?.hostel, weight: 5 },
    { label: 'Bio', value: profile?.bio, weight: 5 },
  ]
  const completenessScore = completenessFields.reduce(
    (sum, f) => sum + (f.value ? f.weight : 0), 0
  )
  const missingRequired = completenessFields
    .filter(f => f.weight >= 15 && !f.value)
    .map(f => f.label)
  const isSellerOrProvider = profile?.role === 'seller' || profile?.role === 'provider'

  if (loading) {
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

  return (
    <>
    <style>{`
        .profile-layout { display: grid; grid-template-columns: 280px 1fr; gap: 32px; align-items: start; }
        @media (max-width: 768px) {
          .profile-layout { grid-template-columns: 1fr !important; gap: 20px; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      {/* Header */}
      <div style={{ background: '#FAFAF8', borderBottom: '1px solid #E8E5E0', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '36px', letterSpacing: '-1px', color: '#111' }}>
              My Profile
            </div>
            {profile?.is_verified && (
              <span
                title="Verified by Campus Connect admin"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: '#1d9bf0', color: '#fff',
                  padding: '4px 12px', fontSize: '12px', fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              >
                <span style={{ fontSize: '14px' }}>✓</span> VERIFIED
              </span>
            )}
          </div>
          <p style={{ color: '#6B6660', marginTop: '4px', fontSize: '14px' }}>{user.email}</p>
        </div>
      </div>

      {/* Profile completion bar */}
      {completenessScore < 100 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #E8E5E0', padding: '14px 20px' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px' }}>
                    PROFILE {completenessScore}% COMPLETE
                  </span>
                  {isSellerOrProvider && missingRequired.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      {missingRequired.join(', ')} required to list
                    </span>
                  )}
                </div>
                <div style={{ height: '8px', background: '#f0f0f0', border: '1px solid #ddd' }}>
                  <div style={{
                    height: '100%',
                    width: `${completenessScore}%`,
                    background: completenessScore >= 80 ? '#1B5E20' : completenessScore >= 50 ? '#f59e0b' : '#dc2626',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  style={{ padding: '8px 16px', background: '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '11px', border: 'none', borderRadius: '8px', cursor: 'pointer', letterSpacing: '0.5px', flexShrink: 0 }}
                >
                  COMPLETE NOW →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {saveMsg && (
        <div style={{
          background: /error|failed|unable|timed out|unexpected|network/i.test(saveMsg) ? '#fee2e2' : '#dcfce7',
          borderBottom: `2px solid ${/error|failed|unable|timed out|unexpected|network/i.test(saveMsg) ? '#ef4444' : '#16a34a'}`,
          padding: '12px 24px', textAlign: 'center', fontWeight: 700, fontSize: '14px',
          color: /error|failed|unable|timed out|unexpected|network/i.test(saveMsg) ? '#dc2626' : '#15803d',
        }}>
          {saveMsg}
        </div>
      )}

      <SectionWrapper className="bg-[#f8f8f8]">
        <div className="profile-layout">

          {/* Sidebar */}
          <div>
            <div style={{ border: '1px solid #E8E5E0', background: '#fff', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '28px 20px', textAlign: 'center' }}>
              {/* Avatar — click anywhere to change */}
              <div
                style={{ position: 'relative', display: 'inline-block', marginBottom: '16px', cursor: 'pointer' }}
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                title="Click to change profile photo"
              >
                {/* Image or initials */}
                {avatarPreview || profile?.avatar_url ? (
                  <img
                    src={avatarPreview ?? profile!.avatar_url!}
                    alt={profile?.name ?? 'Avatar'}
                    style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #E8E5E0', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Syne", sans-serif', fontSize: '34px', border: '3px solid #E8E5E0', margin: '0 auto' }}>
                    {initials}
                  </div>
                )}

                {/* Hover / uploading overlay */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: uploadingAvatar
                    ? 'rgba(27,94,32,0.8)'
                    : avatarHover ? 'rgba(0,0,0,0.55)' : 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s', pointerEvents: 'none', gap: '4px',
                }}>
                  {uploadingAvatar ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.9s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : avatarHover ? (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>CHANGE</span>
                    </>
                  ) : null}
                </div>

                {/* Purple badge bottom-right */}
                {!uploadingAvatar && (
                  <div style={{ position: 'absolute', bottom: 2, right: 2, width: '26px', height: '26px', borderRadius: '50%', background: '#1B5E20', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </div>

              {/* Upload status text */}
              {uploadingAvatar && (
                <div style={{ fontSize: '11px', color: '#1B5E20', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.5px' }}>
                  UPLOADING...
                </div>
              )}

              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '20px', marginBottom: '2px' }}>
                  {profile?.name ?? 'Your Name'}
                </div>
                {profile?.is_verified && (
                  <span
                    title="Verified by Campus Connect"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '18px', height: '18px',
                      background: '#1d9bf0', borderRadius: '50%',
                      fontSize: '10px', color: '#fff', fontWeight: 900,
                      position: 'absolute', top: '2px', right: '-22px',
                    }}
                  >✓</span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>
                {selectedUni ? selectedUni.shortName : profile?.department ?? 'Student'}
              </div>
              {profile?.course && <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>{profile.course}</div>}
              {profile?.class_year && <div style={{ fontSize: '12px', color: '#bbb', marginBottom: '16px' }}>{profile.class_year}</div>}
              {!profile?.course && !profile?.class_year && <div style={{ marginBottom: '16px' }} />}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ border: '1px solid #E8E5E0', borderRadius: '10px', padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', color: '#1B5E20' }}>
                    {(profile?.total_reviews ?? 0) > 0 ? (profile?.rating?.toFixed(1) ?? '—') : '—'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Rating</div>
                </div>
                <div style={{ border: '1px solid #E8E5E0', borderRadius: '10px', padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', color: '#1B5E20' }}>
                    {profile?.total_reviews ?? 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                    {(profile?.total_reviews ?? 0) === 0 ? 'No reviews' : 'Reviews'}
                  </div>
                </div>
              </div>

              {/* Role Badge */}
              <div style={{ display: 'inline-block', padding: '4px 14px', background: '#1B5E20', color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
                {profile?.role ?? 'Student'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/my-listings" style={{ display: 'block', padding: '10px', background: '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '12px', textDecoration: 'none', letterSpacing: '0.5px', borderRadius: '8px' }}>
                  MY LISTINGS →
                </Link>
                <Link href="/dashboard" style={{ display: 'block', padding: '10px', background: '#fff', color: '#111', fontFamily: '"Syne", sans-serif', fontSize: '12px', textDecoration: 'none', border: '1px solid #E8E5E0', borderRadius: '8px', letterSpacing: '0.5px' }}>
                  DASHBOARD
                </Link>
                <button
                  onClick={async () => { await signOut(); router.push('/') }}
                  style={{ padding: '10px', background: 'none', color: '#dc2626', fontWeight: 700, fontSize: '12px', border: '1px solid #fca5a5', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main — Edit Form */}
          <div>
            <div style={{ border: '1px solid #E8E5E0', background: '#fff', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ background: '#FAFAF8', padding: '16px 24px', borderBottom: '1px solid #E8E5E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '14px', letterSpacing: '0.5px', color: '#111' }}>Profile Information</span>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    style={{ padding: '8px 20px', background: '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', letterSpacing: '0.5px' }}
                  >
                    EDIT
                  </button>
                )}
              </div>

              <div style={{ padding: '28px 24px' }}>
                {editing ? (
                  <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Name */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>FULL NAME *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Kwame Asante"
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E5E0', borderRadius: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>PHONE / WHATSAPP</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#555', fontWeight: 700, pointerEvents: 'none', userSelect: 'none' }}>
                          +233
                        </span>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                          placeholder="241234567"
                          maxLength={9}
                          style={{ width: '100%', padding: '12px 16px 12px 58px', border: '1px solid #E8E5E0', borderRadius: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <p style={{ marginTop: '4px', fontSize: '11px', color: '#888' }}>Enter the 9 digits after +233</p>
                    </div>

                    {/* University */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>UNIVERSITY</label>
                      <UniversityPicker
                        value={form.universitySlug}
                        onChange={(slug, uni) => {
                          setForm(p => ({ ...p, universitySlug: slug, department: '', hostel: '' }))
                          setSelectedUni(uni)
                        }}
                      />
                    </div>

                    {/* Programme / Course */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>PROGRAMME / COURSE</label>
                      {form.universitySlug === 'umat' ? (
                        <select
                          value={form.department}
                          onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                          style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E5E0', borderRadius: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                        >
                          <option value="">Select your programme</option>
                          {FACULTIES.map(f => (
                            <optgroup key={f.short} label={f.name}>
                              {f.programmes.map(p => <option key={p} value={p}>{p}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={form.department}
                          onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                          placeholder="e.g. BSc Computer Science"
                          style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E5E0', borderRadius: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      )}
                    </div>

                    {/* Class Year */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>YEAR / LEVEL</label>
                      <select
                        value={form.class_year}
                        onChange={e => setForm(p => ({ ...p, class_year: e.target.value }))}
                        style={{ width: '100%', padding: '12px 16px', border: '2px solid #111', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                      >
                        <option value="">Select year</option>
                        {CLASS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>

                    {/* Hostel */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>HOSTEL / RESIDENCE</label>
                      {form.universitySlug === 'umat' ? (
                        <>
                          {form.hostel && !hostels.all.includes(form.hostel) && (
                            <div style={{ marginBottom: '6px', padding: '6px 10px', background: '#fff8e1', border: '1px solid #f59e0b', fontSize: '11px', color: '#92400e', fontWeight: 600 }}>
                              ⚠ Your saved hostel "{form.hostel}" is no longer listed. Please select an updated option.
                            </div>
                          )}
                          <select
                            value={form.hostel}
                            onChange={e => setForm(p => ({ ...p, hostel: e.target.value }))}
                            style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E5E0', borderRadius: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                          >
                            <option value="">Select hostel</option>
                            {form.hostel && !hostels.all.includes(form.hostel) && (
                              <option value={form.hostel} disabled style={{ color: '#aaa' }}>⚠ {form.hostel} (outdated)</option>
                            )}
                            <optgroup label="Main Halls of Residence">
                              {hostels.main.map(h => <option key={h} value={h}>{h}</option>)}
                            </optgroup>
                            <optgroup label="Private & Affiliated Hostels">
                              {hostels.private.map(h => <option key={h} value={h}>{h}</option>)}
                            </optgroup>
                            <optgroup label="Other">
                              {hostels.other.map(h => <option key={h} value={h}>{h}</option>)}
                            </optgroup>
                          </select>
                        </>
                      ) : (
                        <input
                          type="text"
                          value={form.hostel}
                          onChange={e => setForm(p => ({ ...p, hostel: e.target.value }))}
                          placeholder={selectedUni ? `Hostel or area near ${selectedUni.shortName}` : 'Hostel or residential area'}
                          style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E5E0', borderRadius: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      )}
                    </div>

                    {/* Bio */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>BIO</label>
                      <textarea
                        value={form.bio}
                        onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                        placeholder="Tell other students about yourself..."
                        rows={4}
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E5E0', borderRadius: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>

                    {/* Role */}
                    {profile?.role !== 'admin' && (
                      <div style={{ border: '1px solid #fcd34d', borderRadius: '10px', background: '#fffbeb', padding: '16px' }}>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px', color: '#92400e' }}>ACCOUNT TYPE</label>
                        <select
                          value={form.role ?? profile?.role ?? 'buyer'}
                          onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                          style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E5E0', borderRadius: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                        >
                          <option value="buyer">Buyer — Browse and buy items</option>
                          <option value="seller">Seller — List and sell goods</option>
                          <option value="provider">Service Provider — Offer campus services (barbing, tutoring, laundry, etc.)</option>
                        </select>
                        <p style={{ fontSize: '11px', color: '#92400e', marginTop: '6px', marginBottom: 0 }}>
                          Sellers and providers can also buy — all users can browse the marketplace.
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{ flex: 1, padding: '14px', background: saving ? '#888' : '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '14px', border: 'none', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer' }}
                      >
                        {saving ? 'SAVING...' : 'SAVE CHANGES →'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditing(false); setSaveMsg('') }}
                        style={{ padding: '14px 24px', background: '#fff', color: '#666', fontWeight: 600, border: '1px solid #E8E5E0', borderRadius: '10px', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                      { label: 'FULL NAME', value: profile?.name },
                      { label: 'EMAIL', value: user.email },
                      { label: 'UNIVERSITY', value: selectedUni ? `${selectedUni.shortName} — ${selectedUni.name}` : profile?.university_id ? 'Loading...' : null },
                      { label: 'PHONE / WHATSAPP', value: profile?.phone },
                      { label: 'PROGRAMME / COURSE', value: profile?.department },
                      { label: 'YEAR / LEVEL', value: profile?.class_year },
                      { label: 'HOSTEL', value: profile?.hostel },
                    ].map(field => (
                      <div key={field.label} style={{ paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '1.5px', color: '#888', marginBottom: '4px' }}>{field.label}</div>
                        <div style={{ fontSize: '15px', color: field.value ? '#111' : '#bbb', fontStyle: field.value ? 'normal' : 'italic' }}>
                          {field.value ?? 'Not set'}
                        </div>
                      </div>
                    ))}
                    {profile?.bio && (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '1.5px', color: '#888', marginBottom: '4px' }}>BIO</div>
                        <div style={{ fontSize: '15px', lineHeight: 1.6 }}>{profile.bio}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* University Email Verification */}
            <div style={{ marginTop: '24px', border: '1px solid #E8E5E0', borderRadius: '14px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ background: '#FAFAF8', padding: '14px 24px', borderBottom: '1px solid #E8E5E0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '14px', letterSpacing: '0.5px', color: '#111' }}>
                  University Email Verification
                </span>
                {emailStep === 'verified' && (
                  <span style={{ background: '#1B5E20', color: '#fff', padding: '3px 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                    ✓ VERIFIED
                  </span>
                )}
              </div>
              <div style={{ padding: '20px 24px' }}>
                {emailStep === 'verified' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ color: '#1B5E20' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#1B5E20' }}>{verifiedUniEmail}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '3px', lineHeight: 1.5 }}>
                        Your university email is verified. This builds trust with buyers and clients.
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '13px', color: '#555', marginBottom: '16px', lineHeight: 1.5 }}>
                      Verify your university email <strong>(.edu.gh)</strong> to earn a trust badge visible on your listings.
                    </p>
                    {emailStep === 'idle' ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="email"
                          value={uniEmail}
                          onChange={e => setUniEmail(e.target.value)}
                          placeholder="yourname@st.umat.edu.gh"
                          style={{ flex: 1, minWidth: '220px', padding: '10px 14px', border: '1px solid #E8E5E0', borderRadius: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <button
                          onClick={handleSendOtp}
                          disabled={emailLoading}
                          style={{ padding: '10px 20px', background: emailLoading ? '#888' : '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '12px', border: 'none', borderRadius: '8px', cursor: emailLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}
                        >
                          {emailLoading ? 'SENDING...' : 'SEND CODE →'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#555' }}>
                          Enter the 6-digit code sent to <strong>{uniEmail}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            style={{ width: '150px', padding: '10px 14px', border: '1px solid #E8E5E0', borderRadius: '8px', fontFamily: '"Syne", sans-serif', fontSize: '22px', letterSpacing: '8px', outline: 'none', textAlign: 'center' }}
                          />
                          <button
                            onClick={handleConfirmOtp}
                            disabled={emailLoading}
                            style={{ padding: '10px 20px', background: emailLoading ? '#888' : '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '12px', border: 'none', borderRadius: '8px', cursor: emailLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px' }}
                          >
                            {emailLoading ? 'VERIFYING...' : 'VERIFY →'}
                          </button>
                          <button
                            onClick={() => { setEmailStep('idle'); setOtpCode(''); setEmailMsg('') }}
                            style={{ padding: '10px 14px', background: '#fff', color: '#666', fontWeight: 600, border: '1px solid #E8E5E0', borderRadius: '8px', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '12px' }}
                          >
                            Change email
                          </button>
                        </div>
                      </div>
                    )}
                    {emailMsg && (
                      <div style={{
                        marginTop: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 600,
                        background: /error|fail|invalid|expired/i.test(emailMsg) ? '#fee2e2' : '#dcfce7',
                        color: /error|fail|invalid|expired/i.test(emailMsg) ? '#dc2626' : '#15803d',
                        border: `1px solid ${/error|fail|invalid|expired/i.test(emailMsg) ? '#ef4444' : '#16a34a'}`,
                      }}>
                        {emailMsg}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Account Quick Links */}
            <div style={{ marginTop: '24px', border: '1px solid #E8E5E0', borderRadius: '14px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ background: '#FAFAF8', padding: '14px 24px', borderBottom: '1px solid #E8E5E0' }}>
                <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '14px', letterSpacing: '0.5px', color: '#111' }}>Account</span>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/messages" style={{ padding: '10px 20px', border: '1px solid #E8E5E0', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none', color: '#111', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Messages
                </Link>
                <Link href="/my-listings" style={{ padding: '10px 20px', border: '1px solid #E8E5E0', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none', color: '#111', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  My Listings
                </Link>
                <Link href="/sell" style={{ padding: '10px 20px', background: '#1B5E20', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: '"Syne", sans-serif', fontSize: '13px', textDecoration: 'none' }}>
                  + SELL AN ITEM
                </Link>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{ marginTop: '40px', border: '2px solid #dc2626', background: '#fff' }}>
              <div style={{ background: '#dc2626', padding: '14px 24px' }}>
                <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '14px', letterSpacing: '0.5px', color: '#fff' }}>DANGER ZONE</span>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111', marginBottom: '4px' }}>Delete Account</div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>
                      Permanently removes your profile, all listings, and data. This cannot be undone.
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{ padding: '10px 20px', background: '#fff', color: '#dc2626', border: '2px solid #dc2626', fontFamily: '"Syne", sans-serif', fontSize: '12px', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#dc2626'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#dc2626' }}
                  >
                    DELETE ACCOUNT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

    {/* Delete Account Modal */}

    {showDeleteModal && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        onClick={e => { if (e.target === e.currentTarget && !deleting) setShowDeleteModal(false) }}
      >
        <div style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxWidth: '440px', width: '100%', overflow: 'hidden' }}>
          <div style={{ background: '#dc2626', color: '#fff', padding: '16px 24px', fontFamily: '"Syne", sans-serif', fontSize: '15px', letterSpacing: '0.5px' }}>
            CONFIRM ACCOUNT DELETION
          </div>
          <div style={{ padding: '28px 24px' }}>
            <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.7, marginBottom: '20px' }}>
              This will permanently delete your account, all listings, and profile data. <strong>This action cannot be undone.</strong>
            </p>
            <div style={{ background: '#fee2e2', border: '1px solid #dc2626', padding: '12px 16px', fontSize: '13px', color: '#991b1b', marginBottom: '20px', lineHeight: 1.5 }}>
              ⚠ Type <strong>DELETE</strong> to confirm you understand this is irreversible.
            </div>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={deleting}
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #dc2626', fontFamily: '"Syne", sans-serif', fontSize: '16px', letterSpacing: '2px', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase', marginBottom: '16px' }}
            />
            {deleteError && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '16px', border: '1px solid #dc2626' }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                style={{ flex: 1, padding: '14px 20px', background: deleteConfirm === 'DELETE' && !deleting ? '#dc2626' : '#ccc', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '13px', letterSpacing: '0.5px', border: '2px solid #111', cursor: deleteConfirm === 'DELETE' && !deleting ? 'pointer' : 'not-allowed' }}
              >
                {deleting ? 'DELETING...' : 'YES, DELETE MY ACCOUNT'}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeleteError(null) }}
                disabled={deleting}
                style={{ padding: '14px 20px', background: '#fff', color: '#111', fontWeight: 700, border: '2px solid #111', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
