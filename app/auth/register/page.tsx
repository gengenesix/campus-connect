"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FACULTIES, CLASS_YEARS } from '@/lib/umat-data'
import { useHostels } from '@/lib/useHostels'
import UniversityPicker from '@/components/UniversityPicker'
import { type GhanaUniversity } from '@/lib/ghana-universities'

async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
}

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    department: '', course: '', class_year: '', hostel: '', phone: '', role: 'buyer',
    universitySlug: '', universityId: '',
  })
  const [selectedUni, setSelectedUni] = useState<GhanaUniversity | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const hostels = useHostels()

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [user, router])

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  const validateStep1 = () => {
    if (!form.name.trim()) return 'Please enter your full name.'
    if (!form.email.trim()) return 'Please enter your email address.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const err = validateStep1()
    if (err) { setError(err); return }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.universitySlug) { setError('Please select your university.'); return }
    // Sellers and providers must provide phone
    if (form.role !== 'buyer') {
      if (!form.phone.trim()) { setError('Phone/WhatsApp is required for sellers and service providers.'); return }
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    })

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'This email is already registered. Try signing in instead.'
          : signUpError.message
      )
      setLoading(false)
      return
    }

    // Write profile data immediately — also updated by the DB trigger,
    // but upsert ensures all fields including new ones are saved
    if (data.user) {
      // Resolve university_id from slug via DB
      let universityId: string | null = null
      if (form.universitySlug) {
        const { data: uniRow } = await supabase
          .from('universities')
          .select('id')
          .eq('slug', form.universitySlug)
          .single()
        universityId = uniRow?.id ?? null
      }

      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: form.email,
        name: form.name,
        department: form.department || null,
        course: form.course || null,
        class_year: form.class_year || null,
        hostel: form.hostel || null,
        phone: form.phone ? '+233' + form.phone.replace(/\D/g, '') : null,
        role: form.role,
        university_id: universityId,
      })
    }

    // Fire welcome event (non-blocking — ignore errors)
    void fetch('/api/auth/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name }),
    })

    if (!data.session) {
      setSuccess(true)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8f8f8' }}>
        <div style={{ width: '100%', maxWidth: '480px', border: '3px solid #1B5E20', background: '#fff', boxShadow: '8px 8px 0 #1B5E20', padding: '40px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', marginBottom: '12px', color: '#1B5E20' }}>
            CHECK YOUR EMAIL
          </div>
          <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '24px' }}>
            We sent a confirmation link to <strong>{form.email}</strong>. Click the link to activate your account, then come back and sign in.
          </p>
          <Link href="/auth/login" style={{
            display: 'block', textAlign: 'center', padding: '14px 32px',
            background: '#1B5E20', color: '#fff',
            fontFamily: '"Syne", sans-serif', fontSize: '15px',
            textDecoration: 'none', border: '2px solid #111',
            boxShadow: '4px 4px 0 #111',
          }}>
            GO TO SIGN IN
          </Link>
        </div>
      </div>
    )
  }

  const isSeller = form.role !== 'buyer'

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8f8f8' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ border: '3px solid #111', background: '#fff', boxShadow: '8px 8px 0 #111' }}>

          {/* Header */}
          <div style={{ background: '#1B5E20', padding: '28px 32px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '20px', color: '#fff', marginBottom: '8px', opacity: 0.8 }}>
                CAMPUS<span style={{ color: '#86efac' }}>.</span>CONNECT
              </div>
            </Link>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', color: '#fff', letterSpacing: '-0.5px' }}>
              JOIN FREE
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '6px' }}>
              Step {step} of 2 · {step === 1 ? 'Create your account' : 'Your university profile'}
            </div>
            <div style={{ marginTop: '14px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: step === 1 ? '50%' : '100%', background: '#86efac', transition: 'width 0.4s ease', borderRadius: '2px' }} />
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            {error && (
              <div style={{ background: '#fee2e2', border: '2px solid #ef4444', padding: '12px 16px', marginBottom: '20px', fontSize: '14px', color: '#dc2626', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign Up — step 1 only */}
            {step === 1 && (
              <>
                <Button
                  type="button"
                  variant="brutal-outline"
                  onClick={signInWithGoogle}
                  className="w-full h-auto py-3.5 mb-4 text-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  SIGN UP WITH GOOGLE
                </Button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px' }}>OR WITH EMAIL</span>
                  <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
                </div>
              </>
            )}

            {step === 1 ? (
              <form onSubmit={handleStep1} noValidate>
                {[
                  { key: 'name', label: 'FULL NAME *', type: 'text', placeholder: 'Kwame Asante', autoComplete: 'name' },
                  { key: 'email', label: 'EMAIL ADDRESS *', type: 'email', placeholder: 'kwame@email.com', autoComplete: 'email' },
                  { key: 'password', label: 'PASSWORD (8+ CHARACTERS) *', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
                  { key: 'confirmPassword', label: 'CONFIRM PASSWORD *', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                      {field.label}
                    </label>
                    <Input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={e => update(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      required
                      className="text-[15px] focus-visible:border-[#1B5E20]"
                    />
                  </div>
                ))}
                <Button type="submit" variant="brutal" className="w-full h-auto py-4 mt-2 text-[15px]">
                  CONTINUE →
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* University */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                    YOUR UNIVERSITY *
                  </label>
                  <UniversityPicker
                    value={form.universitySlug}
                    onChange={(slug, uni) => {
                      setForm(p => ({ ...p, universitySlug: slug, department: '', hostel: '' }))
                      setSelectedUni(uni)
                    }}
                    required
                    error={!form.universitySlug}
                  />
                  {!form.universitySlug && (
                    <p style={{ marginTop: '4px', fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                      Select your university to continue
                    </p>
                  )}
                </div>

                {/* Role */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '12px' }}>
                    I AM PRIMARILY A... *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      {
                        val: 'buyer', label: 'BUYER', desc: 'Buy goods & book services',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
                      },
                      {
                        val: 'seller', label: 'SELLER', desc: 'Sell items on campus',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
                      },
                      {
                        val: 'provider', label: 'PROVIDER', desc: 'Offer campus services',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
                      },
                    ].map(r => (
                      <button
                        key={r.val}
                        type="button"
                        onClick={() => update('role', r.val)}
                        style={{
                          padding: '14px 8px', border: '2px solid',
                          borderColor: form.role === r.val ? '#1B5E20' : '#ddd',
                          background: form.role === r.val ? '#e8f5e9' : '#fff',
                          cursor: 'pointer', textAlign: 'center',
                          fontFamily: '"Plus Jakarta Sans", sans-serif',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'center', color: form.role === r.val ? '#1B5E20' : '#888' }}>
                          {r.icon}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', color: form.role === r.val ? '#1B5E20' : '#666' }}>
                          {r.label}
                        </div>
                      </button>
                    ))}
                  </div>
                  {isSeller && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fff8e1', border: '1px solid #f59e0b', fontSize: '12px', color: '#92400e', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>Sellers &amp; providers must provide phone and department for trust &amp; safety.</span>
                    </div>
                  )}
                </div>

                {/* Programme / Course */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                    PROGRAMME / COURSE (OPTIONAL)
                  </label>
                  {form.universitySlug === 'umat' ? (
                    <select
                      value={form.department}
                      onChange={e => update('department', e.target.value)}
                      style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
                    >
                      <option value="">Select your programme</option>
                      {FACULTIES.map(f => (
                        <optgroup key={f.short} label={f.name}>
                          {f.programmes.map(p => <option key={p} value={p}>{p}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type="text"
                      value={form.department}
                      onChange={e => update('department', e.target.value)}
                      placeholder="e.g. BSc Computer Science"
                      className="focus-visible:border-[#1B5E20]"
                    />
                  )}
                </div>

                {/* Class Year */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                    YEAR / LEVEL
                  </label>
                  <select
                    value={form.class_year}
                    onChange={e => update('class_year', e.target.value)}
                    style={{ width: '100%', padding: '13px 16px', border: '2px solid #ddd', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
                  >
                    <option value="">Select year (optional)</option>
                    {CLASS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Hostel */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                    HOSTEL / AREA (OPTIONAL)
                  </label>
                  {form.universitySlug === 'umat' ? (
                    <select
                      value={form.hostel}
                      onChange={e => update('hostel', e.target.value)}
                      style={{ width: '100%', padding: '13px 16px', border: '2px solid #ddd', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
                    >
                      <option value="">Select hostel (optional)</option>
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
                  ) : (
                    <Input
                      type="text"
                      value={form.hostel}
                      onChange={e => update('hostel', e.target.value)}
                      placeholder={selectedUni ? `Hostel or area near ${selectedUni.shortName}` : 'Hostel or residential area'}
                      className="border-[#ddd] focus-visible:border-[#1B5E20]"
                    />
                  )}
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                    PHONE / WHATSAPP {isSeller ? '*' : '(OPTIONAL)'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#555', fontWeight: 700, pointerEvents: 'none', userSelect: 'none' }}>
                      +233
                    </span>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value.replace(/\D/g, ''))}
                      placeholder="241234567"
                      maxLength={9}
                      className={`pl-[58px] text-[15px] focus-visible:border-[#1B5E20] ${isSeller && !form.phone ? 'border-[#f59e0b]' : 'border-[#ddd]'}`}
                    />
                  </div>
                  <p style={{ marginTop: '4px', fontSize: '11px', color: '#888' }}>
                    Ghana number — enter the 9 digits after +233
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="brutal-green"
                  disabled={loading}
                  className="w-full h-auto py-4 text-[15px]"
                >
                  {loading ? 'CREATING ACCOUNT...' : 'CREATE FREE ACCOUNT →'}
                </Button>

                <Button
                  type="button"
                  variant="brutal-ghost"
                  onClick={() => setStep(1)}
                  className="w-full h-auto py-3 mt-2 text-sm font-semibold"
                >
                  ← Back
                </Button>
              </form>
            )}

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '14px', color: '#666' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: '#5d3fd3', fontWeight: 700 }}>
                Sign in →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
