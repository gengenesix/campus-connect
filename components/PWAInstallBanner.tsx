"use client"

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed in this session or running as installed PWA
    if (
      typeof window === 'undefined' ||
      sessionStorage.getItem('pwa-banner-dismissed') ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Small delay so it doesn't pop up instantly on first pageload
      setTimeout(() => setVisible(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    sessionStorage.setItem('pwa-banner-dismissed', '1')
  }

  if (!visible || dismissed) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(480px, calc(100vw - 32px))',
        background: '#111',
        border: '3px solid #1B5E20',
        boxShadow: '6px 6px 0 #1B5E20',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 18px',
        animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(24px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* App icon */}
      <img
        src="/pwa-icon-192.png"
        alt="Campus Connect"
        width={44}
        height={44}
        style={{ borderRadius: '10px', flexShrink: 0, border: '2px solid #1B5E20' }}
      />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', color: '#fff', letterSpacing: '0.3px' }}>
          Add to Home Screen
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
          Install Campus Connect for faster access
        </div>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        style={{
          padding: '9px 16px',
          background: '#1B5E20',
          color: '#fff',
          fontFamily: '"Archivo Black", sans-serif',
          fontSize: '12px',
          letterSpacing: '0.5px',
          border: '2px solid #1B5E20',
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        INSTALL
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: '#666',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '4px',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}
