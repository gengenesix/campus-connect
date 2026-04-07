import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — used in Client Components and context
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Direct client for when SSR client isn't needed
export const createSupabaseClient = () =>
  createClient(supabaseUrl, supabaseAnonKey)

export type { User } from '@supabase/supabase-js'
