"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, user, profile, loading: authLoading } = useAuth()

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
  // Don't honour a redirect to /admin from the URL — middleware already handles that gate
  const rawRedirect = searchParams.get('redirect') || '/dashboard'
  const redirectTo = rawRedirect.startsWith('/admin') ? '/dashboard' : rawRedirect

  // Wait for both user AND profile to be loaded so we can route to the right place
  useEffect(() => {
    if (!authLoading && user && profile) {
      router.push(profile.role === 'admin' ? '/admin' : redirectTo)
    }
  }, [authLoading, user, profile, router, redirectTo])

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
      // On success: don't redirect here — the useEffect above handles it
      // once the profile is fetched and role is known
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8f8f8' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ border: '3px solid #111', background: '#fff', boxShadow: '8px 8px 0 #111' }}>

          {/* Header */}
          <div style={{ background: '#111', padding: '28px 32px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '20px', color: '#fff', marginBottom: '8px', opacity: 0.8 }}>
                CAMPUS<span style={{ color: '#a78bfa' }}>.</span>CONNECT
              </div>
            </Link>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '30px', color: '#fff', letterSpacing: '-0.5px' }}>
              SIGN IN
            </div>
            <div style={{ color: '#666', fontSize: '13px', marginTop: '6px' }}>
              Welcome back to Ghana's campus marketplace
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign In */}
            <Button
              type="button"
              variant="brutal-outline"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full h-auto py-3.5 mb-5 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {googleLoading ? 'REDIRECTING...' : 'CONTINUE WITH GOOGLE'}
            </Button>

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
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="text-[15px]"
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', color: '#111' }}>
                    PASSWORD
                  </label>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="text-[15px]"
                />
              </div>

              <Button
                type="submit"
                variant="brutal"
                disabled={loading}
                className="w-full h-auto py-4 text-[15px]"
              >
                {loading ? 'SIGNING IN...' : 'SIGN IN →'}
              </Button>
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
