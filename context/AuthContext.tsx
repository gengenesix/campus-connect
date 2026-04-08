"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  email: string
  name: string | null
  department: string | null
  course: string | null
  class_year: string | null
  hostel: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
  role: 'buyer' | 'seller' | 'provider' | 'admin'
  rating: number
  total_reviews: number
  is_verified: boolean
  is_banned?: boolean
  created_at?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // Track in-flight profile fetch to avoid double-fetching
  const fetchingRef = useRef<string | null>(null)

  const fetchProfile = async (userId: string) => {
    if (fetchingRef.current === userId) return
    fetchingRef.current = userId
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) setProfile(data as Profile)
    } catch {
      // Ignore network errors — profile will be null, user stays logged in
    } finally {
      fetchingRef.current = null
    }
  }

  useEffect(() => {
    // Use ONLY onAuthStateChange — it fires INITIAL_SESSION on mount which
    // is the canonical way to get the current session in @supabase/ssr.
    // Calling getSession() alongside onAuthStateChange creates a race condition
    // where stale cached data can briefly override the validated server state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Fetch profile on sign-in, token refresh, and initial session
          if (
            event === 'SIGNED_IN' ||
            event === 'INITIAL_SESSION' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'USER_UPDATED'
          ) {
            await fetchProfile(session.user.id)
          }
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
    setSession(null)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' }
    try {
      // Strip fields that must not be changed by the user
      const { id, email, created_at, rating, total_reviews, is_verified, is_banned, ...safeUpdates } = updates as any

      // Use upsert so that if the trigger-created row doesn't exist yet, it gets created.
      // Always include id + email so the upsert has everything required.
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, email: user.email ?? '', ...safeUpdates },
          { onConflict: 'id' }
        )

      if (error) return { error: error.message }

      // Refetch so local state reflects what was actually saved
      await fetchProfile(user.id)
      return { error: null }
    } catch (err: any) {
      return { error: err?.message ?? 'Update failed. Please try again.' }
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
