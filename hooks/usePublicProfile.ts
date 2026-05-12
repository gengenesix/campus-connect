"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface PublicProfile {
  id: string
  name: string | null
  department: string | null
  course: string | null
  class_year: string | null
  hostel: string | null
  bio: string | null
  avatar_url: string | null
  role: string
  rating: number
  total_reviews: number
  is_verified: boolean
  created_at: string
}

export interface ProfileListing {
  id: string
  title?: string
  name?: string
  price?: number
  rate?: string | null
  image_url: string | null
  category: string
  type: 'good' | 'service'
}

export function usePublicProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [listings, setListings] = useState<ProfileListing[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!userId) return

    const load = async () => {
      setLoading(true)
      setNotFound(false)

      const { data: p, error } = await supabase
        .from('profiles')
        .select('id, name, department, course, class_year, hostel, bio, avatar_url, role, rating, total_reviews, is_verified, created_at')
        .eq('id', userId)
        .single()

      if (error || !p) { setNotFound(true); setLoading(false); return }
      setProfile(p as PublicProfile)

      const [{ data: goods }, { data: services }] = await Promise.all([
        supabase.from('products')
          .select('id, title, price, image_url, category')
          .eq('seller_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('services')
          .select('id, name, rate, image_url, category')
          .eq('provider_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      setListings([
        ...((goods ?? []).map((g: any) => ({ ...g, type: 'good' as const }))),
        ...((services ?? []).map((s: any) => ({ ...s, type: 'service' as const }))),
      ])
      setLoading(false)
    }

    load()
  }, [userId])

  return { profile, listings, loading, notFound }
}
