import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import SiteNav from "@/components/SiteNav"
import SiteFooter from "@/components/SiteFooter"
import { AuthProvider } from "@/context/AuthContext"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Campus Connect — UMaT Student Marketplace",
  description:
    "Buy and sell goods or book campus services from fellow UMaT students. 100% free. No commission. No hidden fees.",
  keywords: ["UMaT", "campus marketplace", "student marketplace", "Ghana", "Tarkwa", "buy sell campus"],
  openGraph: {
    title: "Campus Connect — UMaT Student Marketplace",
    description: "Buy and sell goods or book campus services from fellow UMaT students. 100% free.",
    type: "website",
  },
  icons: {
    icon: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Archivo+Black&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <SiteNav />
          <div style={{ minHeight: '100vh' }}>{children}</div>
          <SiteFooter />
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
      </body>
    </html>
  )
}
