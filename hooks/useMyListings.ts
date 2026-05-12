"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export interface Listing {
  id: string
  title: string
  price: number
  category: string
  condition: string
  status: string
  image_url: string | null
  views: number
  in_stock: boolean
  created_at: string
}

interface Options {
  limit?: number
}

export function useMyListings({ limit }: Options = {}) {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchListings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let q = supabase
      .from('products')
      .select('id, title, price, category, condition, status, image_url, views, in_stock, created_at')
      .eq('seller_id', user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
    if (limit) q = q.limit(limit)
    const { data } = await q
    setListings((data as Listing[]) ?? [])
    setLoading(false)
  }, [user, limit])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleDelete = async (id: string) => {
    if (!user) return
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeletingId(id)
    const { error } = await supabase
      .from('products')
      .update({ status: 'deleted' })
      .eq('id', id)
      .eq('seller_id', user.id)
    if (!error) {
      setListings(prev => prev.filter(l => l.id !== id))
      showToast('Listing deleted.')
    } else {
      showToast('Error: ' + error.message)
    }
    setDeletingId(null)
  }

  const handleToggleStatus = async (listing: Listing) => {
    if (!user || listing.status === 'pending') return
    const newStatus = listing.status === 'active' ? 'sold' : 'active'
    setTogglingId(listing.id)
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', listing.id)
      .eq('seller_id', user.id)
    if (!error) {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l))
    }
    setTogglingId(null)
  }

  const handleToggleStock = async (listing: Listing) => {
    if (!user || listing.status === 'pending') return
    const newStock = !listing.in_stock
    setTogglingId(listing.id + '_stock')
    const { error } = await supabase
      .from('products')
      .update({ in_stock: newStock })
      .eq('id', listing.id)
      .eq('seller_id', user.id)
    if (!error) {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, in_stock: newStock } : l))
      showToast(newStock ? 'Marked as in stock' : 'Marked as out of stock')
    }
    setTogglingId(null)
  }

  return {
    listings,
    loading,
    togglingId,
    deletingId,
    toast,
    showToast,
    fetchListings,
    handleDelete,
    handleToggleStatus,
    handleToggleStock,
  }
}
