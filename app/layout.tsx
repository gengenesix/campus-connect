import type React from "react"
import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import "./globals.css"
import SiteNav from "@/components/SiteNav"
import SiteFooter from "@/components/SiteFooter"
import { AuthProvider } from "@/context/AuthContext"
import { Toaster } from "sonner"
import PWAInstallBanner from "@/components/PWAInstallBanner"
import MobileNav from "@/components/MobileNav"
import SellFAB from "@/components/SellFAB"
import PostHogProvider from "@/components/PostHogProvider"

export const metadata: Metadata = {
  title: "Campus Connect — Ghana's Campus Marketplace",
  description:
    "Buy and sell goods or book campus services from fellow students across all 43 Ghanaian universities. 100% free. No commission. No hidden fees.",
  keywords: ["Ghana campus marketplace", "student marketplace", "Ghana university", "buy sell campus", "KNUST", "UG", "UCC", "UMaT", "UHAS", "UDS"],
  openGraph: {
    title: "Campus Connect — Ghana's Campus Marketplace",
    description: "Buy and sell goods or book campus services from fellow students across 43 Ghana universities. 100% free.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/pwa-icon-180.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Campus Connect",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: "#111111",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Archivo+Black&display=swap"
          rel="stylesheet"
        />
        {/* Preconnect to Supabase for faster first DB query */}
        <link rel="preconnect" href="https://mmrzycgqnsuocpqalreg.supabase.co" />
        <link rel="dns-prefetch" href="https://mmrzycgqnsuocpqalreg.supabase.co" />
      </head>
      <body>
        <AuthProvider>
          <SiteNav />
          <div style={{ minHeight: '100vh' }}>{children}</div>
          <SiteFooter />
          <PWAInstallBanner />
          <MobileNav />
          <SellFAB />
          <Suspense fallback={null}><PostHogProvider /></Suspense>
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                border: '2px solid #111',
                borderRadius: '0',
                boxShadow: '4px 4px 0 #111',
              },
            }}
          />
        </AuthProvider>

        {/* PWA service worker registration */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .catch(function(err) { console.warn('SW registration failed:', err) })
                })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
