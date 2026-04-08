"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const DEPARTMENTS = [
  'Mining Engineering', 'Electrical/Electronic Engineering', 'Mechanical Engineering',
  'Computer Science & Engineering', 'Geomatic Engineering', 'Petroleum Engineering',
  'Metallurgical Engineering', 'Civil Engineering', 'Materials Engineering',
  'Environmental & Safety Engineering', 'Other',
]
const HOSTELS = [
  'Kwame Nkrumah Hall', 'Akuafo Hall', 'Mensah Sarbah Hall',
  'Volta Hall', 'Commonwealth Hall', 'Off-Campus', 'Other',
]
const CLASS_YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Postgraduate', 'PhD']

export default function ProfilePage() {
  const { user, profile, loading, updateProfile, signOut } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    department: '',
    course: '',
    class_year: '',
    hostel: '',
    phone: '',
    bio: '',
  })

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/profile')
  }, [user, loading, router])

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? '',
        department: profile.department ?? '',
        course: profile.course ?? '',
        class_year: profile.class_year ?? '',
        hostel: profile.hostel ?? '',
        phone: profile.phone ?? '',
        bio: profile.bio ?? '',
      })
    }
  }, [profile])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 3 * 1024 * 1024) { setSaveMsg('Avatar must be under 3MB'); return }

    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const { error } = await updateProfile({ avatar_url: publicUrl } as any)
      if (!error) {
        setSaveMsg('Profile picture updated!')
      } else {
        setSaveMsg(`Upload error: ${error}`)
      }
    } else {
      setSaveMsg('Avatar upload failed — check that the storage bucket is configured.')
    }
    setUploadingAvatar(false)
    setTimeout(() => setSaveMsg(''), 4000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setSaveMsg('Full name is required.'); return }
    setSaving(true)
    setSaveMsg('')

    try {
      const { error } = await updateProfile({
        name: form.name.trim(),
        department: form.department || null,
        course: form.course || null,
        class_year: form.class_year || null,
        hostel: form.hostel || null,
        phone: form.phone || null,
        bio: form.bio || null,
      } as any)

      if (error) {
        setSaveMsg(`Error: ${error}`)
      } else {
        setEditing(false)
        setSaveMsg('Profile updated successfully!')
      }
    } catch (err: any) {
      setSaveMsg(`Unexpected error: ${err?.message ?? 'Please try again.'}`)
    } finally {
      setSaving(false)
    }
    setTimeout(() => setSaveMsg(''), 4000)
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '36px 20px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', letterSpacing: '-1px' }}>
              MY PROFILE
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
          <p style={{ color: '#888', marginTop: '4px', fontSize: '14px' }}>{user.email}</p>
        </div>
      </div>

      {saveMsg && (
        <div style={{
          background: saveMsg.startsWith('Error') || saveMsg.startsWith('Unexpected') || saveMsg.startsWith('Avatar upload') ? '#fee2e2' : '#dcfce7',
          borderBottom: `2px solid ${saveMsg.startsWith('Error') || saveMsg.startsWith('Unexpected') || saveMsg.startsWith('Avatar upload') ? '#ef4444' : '#16a34a'}`,
          padding: '12px 24px', textAlign: 'center', fontWeight: 700, fontSize: '14px',
          color: saveMsg.startsWith('Error') || saveMsg.startsWith('Unexpected') || saveMsg.startsWith('Avatar upload') ? '#dc2626' : '#15803d',
        }}>
          {saveMsg}
        </div>
      )}

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', alignItems: 'start' }}>

          {/* Sidebar */}
          <div>
            <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '6px 6px 0 #111', padding: '28px 20px', textAlign: 'center' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name ?? ''}
                    style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #111', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Archivo Black", sans-serif', fontSize: '32px', border: '3px solid #111', margin: '0 auto' }}>
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', background: '#5d3fd3', color: '#fff', border: '2px solid #111', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Change profile picture"
                >
                  {uploadingAvatar ? '…' : '✎'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </div>

              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', marginBottom: '2px' }}>
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
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>{profile?.department ?? 'UMaT Student'}</div>
              {profile?.course && <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>{profile.course}</div>}
              {profile?.class_year && <div style={{ fontSize: '12px', color: '#bbb', marginBottom: '16px' }}>{profile.class_year}</div>}
              {!profile?.course && !profile?.class_year && <div style={{ marginBottom: '16px' }} />}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Rating', value: profile?.rating?.toFixed(1) ?? '—' },
                  { label: 'Reviews', value: profile?.total_reviews?.toString() ?? '0' },
                ].map(stat => (
                  <div key={stat.label} style={{ border: '2px solid #eee', padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '22px', color: '#1B5E20' }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Role Badge */}
              <div style={{ display: 'inline-block', padding: '4px 14px', background: '#1B5E20', color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
                {profile?.role ?? 'Student'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/my-listings" style={{ display: 'block', padding: '10px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', textDecoration: 'none', letterSpacing: '0.5px' }}>
                  MY LISTINGS →
                </Link>
                <Link href="/dashboard" style={{ display: 'block', padding: '10px', background: '#fff', color: '#111', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', textDecoration: 'none', border: '2px solid #111', letterSpacing: '0.5px' }}>
                  DASHBOARD
                </Link>
                <button
                  onClick={async () => { await signOut(); router.push('/') }}
                  style={{ padding: '10px', background: 'none', color: '#dc2626', fontWeight: 700, fontSize: '12px', border: '1px solid #fca5a5', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif' }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main — Edit Form */}
          <div>
            <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '6px 6px 0 #111' }}>
              <div style={{ background: '#f0f0f0', padding: '16px 24px', borderBottom: '2px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', letterSpacing: '0.5px' }}>PROFILE INFORMATION</span>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    style={{ padding: '8px 20px', background: '#5d3fd3', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', border: '2px solid #111', cursor: 'pointer', letterSpacing: '0.5px' }}
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
                        style={{ width: '100%', padding: '12px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>PHONE / WHATSAPP</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+233 XX XXX XXXX"
                        style={{ width: '100%', padding: '12px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>DEPARTMENT</label>
                      <select
                        value={form.department}
                        onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                        style={{ width: '100%', padding: '12px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                      >
                        <option value="">Select department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    {/* Course */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>PROGRAMME / COURSE</label>
                      <input
                        type="text"
                        value={form.course}
                        onChange={e => setForm(p => ({ ...p, course: e.target.value }))}
                        placeholder="e.g. BSc Mining Engineering"
                        style={{ width: '100%', padding: '12px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Class Year */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>YEAR / LEVEL</label>
                      <select
                        value={form.class_year}
                        onChange={e => setForm(p => ({ ...p, class_year: e.target.value }))}
                        style={{ width: '100%', padding: '12px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                      >
                        <option value="">Select year</option>
                        {CLASS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>

                    {/* Hostel */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>HOSTEL / AREA</label>
                      <select
                        value={form.hostel}
                        onChange={e => setForm(p => ({ ...p, hostel: e.target.value }))}
                        style={{ width: '100%', padding: '12px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                      >
                        <option value="">Select hostel</option>
                        {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Bio */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>BIO</label>
                      <textarea
                        value={form.bio}
                        onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                        placeholder="Tell other students about yourself..."
                        rows={4}
                        style={{ width: '100%', padding: '12px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{ flex: 1, padding: '14px', background: saving ? '#888' : '#1B5E20', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', border: '2px solid #111', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 #111' }}
                      >
                        {saving ? 'SAVING...' : 'SAVE CHANGES →'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditing(false); setSaveMsg('') }}
                        style={{ padding: '14px 24px', background: '#fff', color: '#666', fontWeight: 600, border: '2px solid #ddd', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif' }}
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
                      { label: 'PHONE / WHATSAPP', value: profile?.phone },
                      { label: 'DEPARTMENT', value: profile?.department },
                      { label: 'PROGRAMME / COURSE', value: profile?.course },
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

            {/* Account Quick Links */}
            <div style={{ marginTop: '24px', border: '2px solid #111', background: '#fff', boxShadow: '4px 4px 0 #111' }}>
              <div style={{ background: '#f0f0f0', padding: '14px 24px', borderBottom: '2px solid #111' }}>
                <span style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', letterSpacing: '0.5px' }}>ACCOUNT</span>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/messages" style={{ padding: '10px 20px', border: '2px solid #111', fontWeight: 700, fontSize: '13px', textDecoration: 'none', color: '#111', boxShadow: '3px 3px 0 #111' }}>
                  💬 Messages
                </Link>
                <Link href="/my-listings" style={{ padding: '10px 20px', border: '2px solid #111', fontWeight: 700, fontSize: '13px', textDecoration: 'none', color: '#111', boxShadow: '3px 3px 0 #111' }}>
                  📦 My Listings
                </Link>
                <Link href="/sell" style={{ padding: '10px 20px', background: '#1B5E20', color: '#fff', border: '2px solid #111', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', textDecoration: 'none', boxShadow: '3px 3px 0 #111' }}>
                  + SELL AN ITEM
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
