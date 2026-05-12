"use client"

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import SectionWrapper from '@/components/ui/SectionWrapper'

const FEATURES = [
  'List unlimited goods for sale',
  'Offer unlimited campus services',
  'Admin-reviewed listings for trust',
  'WhatsApp contact integration',
  'Wishlist saves + buyer messages',
  'Keeps Campus Connect free for buyers',
  'Supports Ghana\'s student economy',
]

function SubscribePageInner() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const handleSubscribe = async () => {
    if (!user) { router.push('/auth/login?redirect=/subscribe'); return }
    setPaying(true)
    setPayError('')
    try {
      const res = await fetch('/api/subscribe/init', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setPayError(data.error ?? 'Could not start payment. Try again.'); return }
      window.location.href = data.authorization_url
    } catch {
      setPayError('Network error. Check your connection and try again.')
    } finally {
      setPaying(false)
    }
  }

  const errorMessages: Record<string, string> = {
    payment_failed: 'Your payment did not go through. Please try again.',
    verification_failed: 'We could not verify your payment. Contact support if charged.',
    invalid_amount: 'Payment amount mismatch. Contact support.',
    missing_reference: 'Payment reference missing. Try again.',
    unknown_reference: 'Payment not found. Try again or contact support.',
  }
  const errorMsg = errorParam ? (errorMessages[errorParam] ?? 'Something went wrong. Please try again.') : ''

  return (
    <>
      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '48px 20px' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: '#888', marginBottom: '12px' }}>
            CAMPUS CONNECT · SELLER PLAN
          </div>
          <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(36px, 7vw, 64px)', letterSpacing: '-2px', lineHeight: 1, marginBottom: '16px' }}>
            BECOME A<br />CAMPUS SELLER
          </h1>
          <p style={{ color: '#aaa', fontSize: '16px', maxWidth: '480px', lineHeight: 1.6 }}>
            GHS 20/month. Unlimited listings. Buyers always browse free.
          </p>
        </div>
      </div>

      {/* Error from redirect */}
      {errorMsg && (
        <div style={{ background: '#fee2e2', borderBottom: '2px solid #ef4444', padding: '14px 20px', textAlign: 'center', fontWeight: 700, fontSize: '14px', color: '#dc2626' }}>
          {errorMsg}
        </div>
      )}

      <SectionWrapper className="bg-[#f8f8f8]" innerClassName="max-w-[800px] mx-auto px-4">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'start' }}>

          {/* Pricing card */}
          <div style={{ border: '3px solid #111', background: '#fff', boxShadow: '8px 8px 0 #1B5E20' }}>
            <div style={{ background: '#1B5E20', color: '#fff', padding: '24px 28px', borderBottom: '3px solid #111' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '14px', letterSpacing: '1.5px', marginBottom: '8px' }}>
                SELLER PLAN
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '52px', lineHeight: 1 }}>₵20</span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>/month</span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>
                Billed monthly · Cancel anytime
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ color: '#1B5E20', fontWeight: 900, fontSize: '16px', flexShrink: 0, lineHeight: 1.4 }}>✓</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}

              <div style={{ borderTop: '2px solid #f0f0f0', marginTop: '20px', paddingTop: '20px' }}>
                {payError && (
                  <div style={{ background: '#fee2e2', border: '1px solid #ef4444', padding: '10px 14px', fontSize: '13px', color: '#dc2626', fontWeight: 600, marginBottom: '14px' }}>
                    {payError}
                  </div>
                )}
                <button
                  onClick={handleSubscribe}
                  disabled={paying || loading}
                  style={{
                    width: '100%', padding: '18px',
                    background: (paying || loading) ? '#888' : '#111',
                    color: '#fff',
                    fontFamily: '"Archivo Black", sans-serif', fontSize: '15px',
                    border: '2px solid #111',
                    cursor: (paying || loading) ? 'not-allowed' : 'pointer',
                    boxShadow: (paying || loading) ? 'none' : '5px 5px 0 #1B5E20',
                    letterSpacing: '0.5px', transition: 'all 0.2s',
                  }}
                >
                  {paying ? 'OPENING PAYMENT...' : loading ? 'LOADING...' : 'PAY GHS 20 — START SELLING →'}
                </button>
                <p style={{ marginTop: '12px', fontSize: '11px', color: '#999', textAlign: 'center', lineHeight: 1.6 }}>
                  Powered by Paystack · MTN MoMo · Vodafone Cash · AirtelTigo Money
                </p>
              </div>
            </div>
          </div>

          {/* Why we charge */}
          <div>
            <div style={{ border: '2px solid #111', background: '#fff', padding: '24px', boxShadow: '4px 4px 0 #111', marginBottom: '20px' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', marginBottom: '12px' }}>
                WHY GHS 20?
              </div>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.7, margin: 0 }}>
                Campus Connect is a student-built platform. The GHS 20 seller fee covers server costs, domain, and keeps the platform running for all 43 Ghana universities — so buyers always browse for free.
              </p>
            </div>

            <div style={{ border: '2px solid #111', background: '#fff', padding: '24px', boxShadow: '4px 4px 0 #111', marginBottom: '20px' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '16px', marginBottom: '12px' }}>
                BUYERS STAY FREE
              </div>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.7, margin: 0 }}>
                Anyone can browse listings, message sellers, and save items to their wishlist — completely free, forever. The platform fee only applies to sellers and service providers.
              </p>
            </div>

            <div style={{ border: '2px solid #f59e0b', background: '#fffbeb', padding: '20px 24px' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', color: '#92400e', marginBottom: '8px' }}>
                ALREADY A SELLER?
              </div>
              <p style={{ fontSize: '13px', color: '#78350f', margin: '0 0 12px', lineHeight: 1.5 }}>
                If your subscription has expired, renewing adds 30 days to your remaining time.
              </p>
              <Link href="/dashboard" style={{ fontSize: '13px', color: '#92400e', fontWeight: 700 }}>
                Check subscription status →
              </Link>
            </div>
          </div>

        </div>
      </SectionWrapper>

      <style>{`
        @media (max-width: 480px) {
          .container { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
    </>
  )
}

export default function SubscribePage() {
  return (
    <Suspense fallback={null}>
      <SubscribePageInner />
    </Suspense>
  )
}
