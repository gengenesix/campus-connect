"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, user } = useAuth()

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    if (user) router.push(redirectTo)
  }, [user, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)

    if (error) {
      setError(
        error.includes('Invalid login') || error.includes('credentials')
          ? 'Incorrect email or password. Please try again.'
          : error.includes('Email not confirmed')
          ? 'Please check your email and click the confirmation link first.'
          : error
      )
      setLoading(false)
    } else {
      router.push(redirectTo)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8f8f8' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ border: '3px solid #111', background: '#fff', boxShadow: '8px 8px 0 #111' }}>

          {/* Header */}
          <div style={{ background: '#111', padding: '28px 32px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', color: '#fff', marginBottom: '8px', opacity: 0.8 }}>
                CAMPUS<span style={{ color: '#a78bfa' }}>.</span>CONNECT
              </div>
            </Link>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '30px', color: '#fff', letterSpacing: '-0.5px' }}>
              SIGN IN
            </div>
            <div style={{ color: '#666', fontSize: '13px', marginTop: '6px' }}>
              Welcome back to UMaT&apos;s marketplace
            </div>
          </div>

          {/* Form */}
          <div style={{ padding: '32px' }}>
            {error && (
              <div style={{
                background: '#fee2e2', border: '2px solid #ef4444',
                padding: '12px 16px', marginBottom: '24px',
                fontSize: '14px', color: '#dc2626', fontWeight: 600,
                display: 'flex', gap: '8px', alignItems: 'flex-start',
              }}>
                <span>⚠️</span> <span>{error}</span>
              </div>
            )}

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              style={{
                width: '100%', padding: '14px 16px', marginBottom: '20px',
                background: '#fff', color: '#111',
                fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', fontWeight: 700,
                border: '2px solid #111', cursor: googleLoading ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'all 0.2s', opacity: googleLoading ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!googleLoading) (e.currentTarget as HTMLElement).style.background = '#f8f8f8' }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {googleLoading ? 'REDIRECTING...' : 'CONTINUE WITH GOOGLE'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: '8px', color: '#111' }}>
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@umat.edu.gh"
                  required
                  autoComplete="email"
                  style={{
                    width: '100%', padding: '13px 16px',
                    border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#5d3fd3')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#111')}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', color: '#111' }}>
                    PASSWORD
                  </label>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '13px 16px',
                    border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#5d3fd3')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#111')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '16px',
                  background: loading ? '#888' : '#111',
                  color: loading ? '#ccc' : '#fff',
                  fontFamily: '"Archivo Black", sans-serif', fontSize: '15px',
                  border: '2px solid #111', cursor: loading ? 'not-allowed' : 'pointer',
                  boxSizing: 'border-box', letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'SIGNING IN...' : 'SIGN IN →'}
              </button>
            </form>

            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '14px', color: '#666' }}>
              New to Campus Connect?{' '}
              <Link href="/auth/register" style={{ color: '#5d3fd3', fontWeight: 700 }}>
                Create free account →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
