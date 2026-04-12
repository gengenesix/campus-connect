"use client"

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { HOSTELS } from './umat-data'

export interface HostelOptions {
  main: string[]
  private: string[]
  other: string[]
  all: string[]
}

/** Fetches hostel list from umat_hostels DB table; falls back to hardcoded HOSTELS. */
export function useHostels(): HostelOptions {
  const [hostels, setHostels] = useState<HostelOptions>({
    main: HOSTELS.main,
    private: HOSTELS.private,
    other: HOSTELS.other,
    all: [...HOSTELS.main, ...HOSTELS.private, ...HOSTELS.other],
  })

  useEffect(() => {
    supabase
      .from('umat_hostels')
      .select('type, name')
      .order('name')
      .then(({ data }) => {
        if (!data?.length) return
        const main = data.filter(h => h.type === 'main_hall').map(h => h.name)
        const priv = data.filter(h => h.type === 'private').map(h => h.name)
        const other = data.filter(h => h.type === 'other').map(h => h.name)
        setHostels({ main, private: priv, other, all: [...main, ...priv, ...other] })
      })
  }, [])

  return hostels
}
