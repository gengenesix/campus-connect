import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Campus Connect] Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and ' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings or .env.local file.'
  )
}

// Singleton browser client for all Client Components.
// createBrowserClient handles cookie-based session persistence automatically.
// Never use @supabase/supabase-js createClient() in client components —
// it uses localStorage which doesn't work with SSR and loses sessions on refresh.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export type { User } from '@supabase/supabase-js'

/** Card display type for goods/products — mapped from Supabase products table */
export interface Good {
  id: string
  name: string
  price: number
  condition: string
  category: string
  seller: string
  sellerId?: string
  sellerImage: string
  sellerRating: number
  sellerVerified?: boolean
  image: string
  description: string
  createdAt: string
  views: number
  inStock?: boolean
}

/** Card display type for services — mapped from Supabase services table */
export interface Service {
  id: string
  name: string
  provider: string
  providerId?: string
  providerImage: string
  providerRating: number
  providerVerified?: boolean
  category: string
  rate: string
  description: string
  availability: string
  image: string
  responseTime: string
  bookings: number
}
