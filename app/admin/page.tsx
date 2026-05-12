"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import SectionWrapper from '@/components/ui/SectionWrapper'

interface AdminUser {
  id: string
  email: string
  name: string | null
  department: string | null
  course: string | null
  class_year: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  is_verified: boolean
  is_banned: boolean
  rating: number
  total_reviews: number
  created_at: string
}

interface AdminProduct {
  id: string
  title: string
  price: number
  status: string
  condition: string
  category: string
  views: number
  image_url: string | null
  in_stock: boolean
  created_at: string
  seller: { name: string | null; id: string } | null
}

interface AdminService {
  id: string
  name: string
  category: string
  rate: string | null
  status: string
  image_url: string | null
  total_bookings: number
  created_at: string
  provider: { name: string | null; id: string } | null
}

function initials(name: string | null) {
  return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    active:  { bg: '#dcfce7', color: '#15803d' },
    pending: { bg: '#fff8e1', color: '#92400e' },
    sold:    { bg: '#e0e7ff', color: '#4338ca' },
    paused:  { bg: '#f3f4f6', color: '#6b7280' },
    deleted: { bg: '#fee2e2', color: '#dc2626' },
  }
  const c = colors[status] || { bg: '#f3f4f6', color: '#666' }
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: '10px', fontWeight: 800, padding: '3px 10px',
      letterSpacing: '0.5px', border: `1px solid ${c.color}44`,
      whiteSpace: 'nowrap',
    }}>
      {status.toUpperCase()}
    </span>
  )
}

function VerifiedBadgeInline() {
  return (
    <span title="Verified by Campus Connect admin" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '18px', height: '18px', background: '#1d9bf0', borderRadius: '50%',
      fontSize: '10px', color: '#fff', fontWeight: 900, flexShrink: 0,
      boxShadow: '0 1px 3px rgba(29,155,240,0.4)',
    }}>✓</span>
  )
}

export default function AdminDashboard() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'listings' | 'services' | 'reports'>('pending')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [services, setServices] = useState<AdminService[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'ok' | 'err'>('ok')

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  // Auth guard: redirect non-admins
  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/'); return }
    if (profile !== null && profile.role !== 'admin') router.replace('/')
  }, [user, profile, loading, router])

  // Data loading: fires when auth resolves and user is confirmed admin
  const loadData = useCallback(async () => {
    if (!user || !profile || profile.role !== 'admin') {
      console.debug('[Admin] loadData skipped — not ready or not admin', { uid: user?.id, role: profile?.role })
      return
    }
    console.debug('[Admin] loadData starting for', user.email)
    setLoadingData(true)
    setLoadError(null)
    try {
      const [usersRes, productsRes, servicesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('products')
          .select('id, title, price, status, condition, category, views, image_url, in_stock, created_at, seller:profiles!seller_id(id, name)')
          .neq('status', 'deleted')
          .order('created_at', { ascending: false }),
        supabase.from('services')
          .select('id, name, category, rate, status, image_url, total_bookings, created_at, provider:profiles!provider_id(id, name)')
          .neq('status', 'deleted')
          .order('created_at', { ascending: false }),
      ])

      const errs = [
        usersRes.error && `profiles: ${usersRes.error.message}`,
        productsRes.error && `products: ${productsRes.error.message}`,
        servicesRes.error && `services: ${servicesRes.error.message}`,
      ].filter(Boolean) as string[]

      if (errs.length > 0) {
        console.error('[Admin] Query errors:', errs)
        setLoadError(errs.join(' | '))
      } else {
        console.debug('[Admin] Loaded:', {
          users: usersRes.data?.length,
          products: productsRes.data?.length,
          services: servicesRes.data?.length,
        })
      }

      setUsers((usersRes.data as AdminUser[]) ?? [])
      setProducts((productsRes.data as unknown as AdminProduct[]) ?? [])
      setServices((servicesRes.data as unknown as AdminService[]) ?? [])
    } catch (err: any) {
      console.error('[Admin] loadData exception:', err)
      setLoadError(err?.message ?? 'Network error — check your connection and retry.')
    } finally {
      setLoadingData(false)
    }
  }, [user, profile])

  // Trigger load whenever auth state becomes ready
  useEffect(() => {
    if (loading || !user || !profile) return
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, profile?.role])

  const approveProduct = async (id: string) => {
    setActionId(id)
    const { error } = await supabase.from('products').update({ status: 'active' }).eq('id', id)
    if (!error) { setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p)); showToast('✓ Listing approved and is now live!') }
    else showToast(error.message, 'err')
    setActionId(null)
  }

  const rejectProduct = async (id: string) => {
    if (!confirm('Reject and remove this listing?')) return
    setActionId(id)
    const { error } = await supabase.from('products').update({ status: 'deleted' }).eq('id', id)
    if (!error) { setProducts(prev => prev.filter(p => p.id !== id)); showToast('Listing rejected.') }
    else showToast(error.message, 'err')
    setActionId(null)
  }

  const approveService = async (id: string) => {
    setActionId(id)
    const { error } = await supabase.from('services').update({ status: 'active' }).eq('id', id)
    if (!error) { setServices(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s)); showToast('✓ Service approved and is now live!') }
    else showToast(error.message, 'err')
    setActionId(null)
  }

  const rejectService = async (id: string) => {
    if (!confirm('Reject and remove this service?')) return
    setActionId(id)
    const { error } = await supabase.from('services').update({ status: 'deleted' }).eq('id', id)
    if (!error) { setServices(prev => prev.filter(s => s.id !== id)); showToast('Service rejected.') }
    else showToast(error.message, 'err')
    setActionId(null)
  }

  const toggleVerify = async (userId: string, current: boolean) => {
    setActionId(userId)
    const { error } = await supabase.from('profiles').update({ is_verified: !current }).eq('id', userId)
    if (!error) { setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !current } : u)); showToast(current ? 'Verification removed.' : '✓ User verified!') }
    else showToast(error.message, 'err')
    setActionId(null)
  }

  const toggleBan = async (userId: string, current: boolean) => {
    if (!confirm(current ? 'Unban this user?' : 'Ban this user?')) return
    setActionId(userId)
    const { error } = await supabase.from('profiles').update({ is_banned: !current }).eq('id', userId)
    if (!error) { setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !current } : u)); showToast(current ? 'User unbanned.' : 'User banned.') }
    else showToast(error.message, 'err')
    setActionId(null)
  }

  const removeProduct = async (id: string) => {
    if (!confirm('Remove this listing?')) return
    setActionId(id)
    const { error } = await supabase.from('products').update({ status: 'deleted' }).eq('id', id)
    if (!error) { setProducts(prev => prev.filter(p => p.id !== id)); showToast('Listing removed.') }
    else showToast(error.message, 'err')
    setActionId(null)
  }

  const removeService = async (id: string) => {
    if (!confirm('Remove this service?')) return
    setActionId(id)
    const { error } = await supabase.from('services').update({ status: 'deleted' }).eq('id', id)
    if (!error) { setServices(prev => prev.filter(s => s.id !== id)); showToast('Service removed.') }
    else showToast(error.message, 'err')
    setActionId(null)
  }

  const pendingProducts = products.filter(p => p.status === 'pending')
  const pendingServices = services.filter(s => s.status === 'pending')
  const pendingCount = pendingProducts.length + pendingServices.length
  const bannedCount = users.filter(u => u.is_banned).length
  const verifiedCount = users.filter(u => u.is_verified).length

  const filteredUsers = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.name?.toLowerCase().includes(q) ?? false) || u.email.toLowerCase().includes(q) || (u.department?.toLowerCase().includes(q) ?? false)
  })

  if (loading) {
    return (
      <div style={{ background: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', color: '#fff', letterSpacing: '-0.5px' }}>ADMIN PANEL</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '8px', height: '8px', background: '#ff3366', borderRadius: '50%', animation: `bounce 0.9s ease-in-out ${i * 0.15}s infinite alternate` }} />
          ))}
        </div>
        <style>{`@keyframes bounce { from { opacity:0.2; transform:translateY(0); } to { opacity:1; transform:translateY(-6px); } }`}</style>
      </div>
    )
  }

  // Show loading while redirect fires (prevents white screen flash)
  if (!user || !profile || profile.role !== 'admin') {
    return (
      <div style={{ background: '#111', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '20px', color: '#666' }}>Loading...</div>
      </div>
    )
  }

  const loadReports = async () => {
    if (reportsLoading) return
    setReportsLoading(true)
    try {
      const res = await fetch('/api/reports?status=pending')
      if (res.ok) {
        const json = await res.json()
        setReports(json.reports ?? [])
      }
    } catch {}
    setReportsLoading(false)
  }

  const resolveReport = async (id: string, status: 'resolved' | 'dismissed') => {
    setActionId(id)
    const res = await fetch('/api/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setReports(prev => prev.filter(r => r.id !== id))
      showToast(status === 'resolved' ? '✓ Report resolved' : '✓ Report dismissed')
    } else {
      showToast('Failed to update report', 'err')
    }
    setActionId(null)
  }

  const tabs = [
    { key: 'pending' as const,  label: pendingCount > 0 ? `! PENDING (${pendingCount})` : 'PENDING', urgent: pendingCount > 0 },
    { key: 'users' as const,    label: `USERS (${users.length})`, urgent: false },
    { key: 'listings' as const, label: `LISTINGS (${products.filter(p => p.status !== 'pending').length})`, urgent: false },
    { key: 'services' as const, label: `SERVICES (${services.filter(s => s.status !== 'pending').length})`, urgent: false },
    { key: 'reports' as const,  label: `REPORTS`, urgent: false },
  ]

  return (
    <>

      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '28px 20px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '32px', letterSpacing: '-1px' }}>ADMIN PANEL</div>
              <span style={{ background: '#ff3366', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 10px', letterSpacing: '1px' }}>SUPER ADMIN</span>
              {pendingCount > 0 && (
                <span style={{ background: '#f59e0b', color: '#000', fontSize: '11px', fontWeight: 900, padding: '3px 10px', letterSpacing: '1px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {pendingCount} AWAITING APPROVAL
                  </span>
                </span>
              )}
            </div>
            <p style={{ color: '#666', fontSize: '13px' }}>Campus Connect · {profile?.name ?? user.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => loadData()}
              disabled={loadingData}
              style={{ padding: '10px 20px', border: '2px solid #555', color: loadingData ? '#555' : '#aaa', background: 'transparent', fontFamily: '"Syne", sans-serif', fontSize: '12px', cursor: loadingData ? 'not-allowed' : 'pointer', opacity: loadingData ? 0.6 : 1 }}
            >{loadingData ? '↻ LOADING...' : '↻ RELOAD'}</button>
            <Link href="/dashboard" style={{ padding: '10px 20px', border: '2px solid #444', color: '#ccc', fontFamily: '"Syne", sans-serif', fontSize: '12px', textDecoration: 'none' }}>← DASHBOARD</Link>
            <button
              onClick={async () => { await signOut(); router.replace('/') }}
              style={{ padding: '10px 20px', border: '2px solid #dc2626', color: '#dc2626', background: 'transparent', fontFamily: '"Syne", sans-serif', fontSize: '12px', cursor: 'pointer' }}
            >SIGN OUT</button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          background: toastType === 'err' ? '#fee2e2' : '#dcfce7',
          borderBottom: `3px solid ${toastType === 'err' ? '#ef4444' : '#16a34a'}`,
          padding: '10px 24px', textAlign: 'center', fontWeight: 700, fontSize: '14px',
          color: toastType === 'err' ? '#dc2626' : '#15803d',
        }}>{toast}</div>
      )}

      <SectionWrapper className="bg-[#f8f8f8]">

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'TOTAL USERS',    value: users.length,                                    color: '#5d3fd3' },
            { label: 'VERIFIED',       value: verifiedCount,                                   color: '#1B5E20' },
            { label: 'BANNED',         value: bannedCount,                                     color: '#dc2626' },
            { label: 'PENDING',        value: pendingCount,                                    color: '#f59e0b' },
            { label: 'LIVE LISTINGS',  value: products.filter(p => p.status === 'active').length, color: '#111'    },
            { label: 'LIVE SERVICES',  value: services.filter(s => s.status === 'active').length, color: '#ff3366' },
          ].map(stat => (
            <div key={stat.label} style={{ border: '2px solid #111', background: '#fff', padding: '16px', boxShadow: '4px 4px 0 #111' }}>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '30px', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginTop: '6px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #111', marginBottom: '24px', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); if (tab.key === 'reports' && reports.length === 0) loadReports() }} style={{
              padding: '12px 22px',
              background: activeTab === tab.key ? (tab.urgent ? '#f59e0b' : '#111') : '#fff',
              color: activeTab === tab.key ? '#fff' : tab.urgent ? '#92400e' : '#666',
              border: '2px solid #111', borderBottom: 'none',
              fontFamily: '"Syne", sans-serif', fontSize: '11px', letterSpacing: '0.8px',
              cursor: 'pointer', marginBottom: '-2px', fontWeight: 700,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error banner — shown regardless of loading state */}
        {loadError && (
          <div style={{ background: '#fee2e2', border: '2px solid #dc2626', borderLeft: '6px solid #dc2626', padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '14px', color: '#dc2626', marginBottom: '8px' }}>DATA LOAD ERROR</div>
            <div style={{ fontSize: '13px', color: '#7f1d1d', marginBottom: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{loadError}</div>
            <button onClick={() => loadData()} disabled={loadingData} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', fontFamily: '"Syne", sans-serif', fontSize: '12px', cursor: loadingData ? 'not-allowed' : 'pointer', opacity: loadingData ? 0.6 : 1 }}>
              {loadingData ? 'RETRYING...' : 'RETRY'}
            </button>
          </div>
        )}

        {loadingData && !loadError && <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontWeight: 600 }}>Loading data...</div>}

        {/* ── PENDING TAB ── */}
        {!loadingData && activeTab === 'pending' && (
          pendingCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', border: '2px solid #111', background: '#fff', boxShadow: '6px 6px 0 #111' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: '#1B5E20' }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', marginBottom: '10px' }}>ALL CLEAR</div>
              <p style={{ color: '#888' }}>No listings or services awaiting approval.</p>
            </div>
          ) : (
            <>
              {pendingProducts.length > 0 && (
                <div style={{ marginBottom: '36px' }}>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#111' }}>
                    PENDING LISTINGS
                    <span style={{ background: '#f59e0b', color: '#000', fontSize: '11px', fontWeight: 800, padding: '2px 10px' }}>{pendingProducts.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pendingProducts.map(p => (
                      <div key={p.id} style={{ background: '#fff', border: '2px solid #f59e0b', borderLeft: '5px solid #f59e0b', padding: '16px', display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: '16px', alignItems: 'center' }}>
                        {p.image_url
                          ? <Image src={p.image_url} alt={p.title} width={60} height={60} style={{ objectFit: 'cover', border: '1px solid #eee' }} />
                          : <div style={{ width: '60px', height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
                        }
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{p.title}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            by <strong>{(p.seller as any)?.name ?? 'Unknown'}</strong> · GHS {p.price} · {p.condition} · {p.category}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>
                            {p.in_stock ? '✓ In stock' : '✕ Out of stock'} · {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <Link href={`/goods/${p.id}`} target="_blank" style={{ fontSize: '11px', color: '#5d3fd3', fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginTop: '4px' }}>
                            PREVIEW →
                          </Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                          <button onClick={() => approveProduct(p.id)} disabled={actionId === p.id} style={{ padding: '10px 18px', background: '#1B5E20', color: '#fff', border: '2px solid #111', fontFamily: '"Syne", sans-serif', fontSize: '12px', cursor: actionId === p.id ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 #111', opacity: actionId === p.id ? 0.6 : 1 }}>
                            {actionId === p.id ? '...' : '✓ APPROVE'}
                          </button>
                          <button onClick={() => rejectProduct(p.id)} disabled={actionId === p.id} style={{ padding: '10px 18px', background: '#fff', color: '#dc2626', border: '2px solid #dc2626', fontFamily: '"Syne", sans-serif', fontSize: '12px', cursor: actionId === p.id ? 'not-allowed' : 'pointer', opacity: actionId === p.id ? 0.6 : 1 }}>
                            ✕ REJECT
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingServices.length > 0 && (
                <div>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#111' }}>
                    PENDING SERVICES
                    <span style={{ background: '#f59e0b', color: '#000', fontSize: '11px', fontWeight: 800, padding: '2px 10px' }}>{pendingServices.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pendingServices.map(s => (
                      <div key={s.id} style={{ background: '#fff', border: '2px solid #f59e0b', borderLeft: '5px solid #f59e0b', padding: '16px', display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: '16px', alignItems: 'center' }}>
                        {s.image_url
                          ? <Image src={s.image_url} alt={s.name} width={60} height={60} style={{ objectFit: 'cover', border: '1px solid #eee' }} />
                          : <div style={{ width: '60px', height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
                        }
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{s.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            by <strong>{(s.provider as any)?.name ?? 'Unknown'}</strong> · {s.category} · {s.rate ?? 'No rate'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>
                            {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                          <button onClick={() => approveService(s.id)} disabled={actionId === s.id} style={{ padding: '10px 18px', background: '#1B5E20', color: '#fff', border: '2px solid #111', fontFamily: '"Syne", sans-serif', fontSize: '12px', cursor: actionId === s.id ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 #111', opacity: actionId === s.id ? 0.6 : 1 }}>
                            {actionId === s.id ? '...' : '✓ APPROVE'}
                          </button>
                          <button onClick={() => rejectService(s.id)} disabled={actionId === s.id} style={{ padding: '10px 18px', background: '#fff', color: '#dc2626', border: '2px solid #dc2626', fontFamily: '"Syne", sans-serif', fontSize: '12px', cursor: actionId === s.id ? 'not-allowed' : 'pointer', opacity: actionId === s.id ? 0.6 : 1 }}>
                            ✕ REJECT
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        )}

        {/* ── USERS TAB ── */}
        {!loadingData && activeTab === 'users' && (
          <>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search by name, email, department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: '2px solid #111', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', outline: 'none' }}
              />
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#888', whiteSpace: 'nowrap' }}>{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredUsers.map(u => (
                <div key={u.id} style={{
                  display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: '16px', alignItems: 'center',
                  background: u.is_banned ? '#fff5f5' : '#fff',
                  border: '2px solid #e0e0e0', padding: '14px 16px',
                  borderLeft: `4px solid ${u.is_banned ? '#dc2626' : u.is_verified ? '#1B5E20' : '#f59e0b'}`,
                }}>
                  <div>
                    {u.avatar_url
                      ? <Image src={u.avatar_url} alt={u.name ?? ''} width={44} height={44} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }} />
                      : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>{initials(u.name)}</div>
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>{u.name ?? 'No name'}</span>
                      {u.is_verified && <VerifiedBadgeInline />}
                      <span style={{ background: u.role === 'admin' ? '#ff3366' : u.role === 'seller' ? '#5d3fd3' : u.role === 'provider' ? '#1B5E20' : '#888', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px' }}>
                        {u.role.toUpperCase()}
                      </span>
                      {u.is_banned && <span style={{ background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px' }}>BANNED</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{u.email}</div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {[u.department, u.course, u.class_year].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => toggleVerify(u.id, u.is_verified)}
                      disabled={actionId === u.id || u.role === 'admin' || u.is_banned}
                      style={{
                        padding: '7px 14px',
                        background: u.is_verified ? '#fff' : '#1d9bf0', color: u.is_verified ? '#dc2626' : '#fff',
                        border: u.is_verified ? '2px solid #dc2626' : '2px solid #1d9bf0',
                        fontFamily: '"Syne", sans-serif', fontSize: '10px',
                        cursor: (actionId === u.id || u.role === 'admin' || u.is_banned) ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap', opacity: (u.role === 'admin' || u.is_banned) ? 0.4 : 1,
                      }}
                    >
                      {actionId === u.id ? '...' : u.is_verified ? '✕ REVOKE' : '✓ VERIFY'}
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => toggleBan(u.id, u.is_banned ?? false)}
                        disabled={actionId === u.id}
                        style={{
                          padding: '7px 14px',
                          background: u.is_banned ? '#e8f5e9' : '#fee2e2', color: u.is_banned ? '#1B5E20' : '#dc2626',
                          border: u.is_banned ? '2px solid #1B5E20' : '2px solid #dc2626',
                          fontFamily: '"Syne", sans-serif', fontSize: '10px',
                          cursor: actionId === u.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        {actionId === u.id ? '...' : u.is_banned ? '↩ UNBAN' : '⊘ BAN'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>No users match your search.</div>}
            </div>
          </>
        )}

        {/* ── LISTINGS TAB ── */}
        {!loadingData && activeTab === 'listings' && (
          <>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', marginBottom: '16px' }}>
              LIVE LISTINGS ({products.filter(p => p.status !== 'pending').length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {products.filter(p => p.status !== 'pending').map(p => (
                <div key={p.id} style={{ background: '#fff', border: '2px solid #eee', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    {p.image_url
                      ? <Image src={p.image_url} alt={p.title} width={52} height={52} style={{ objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />
                      : <div style={{ width: '52px', height: '52px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', flexShrink: 0 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>by {(p.seller as any)?.name ?? 'Unknown'} · GHS {p.price} · {p.condition} · {p.category}</div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{p.views} views · {new Date(p.created_at).toLocaleDateString('en-GB')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    <StatusBadge status={p.status} />
                    <Link href={`/goods/${p.id}`} style={{ fontSize: '12px', color: '#5d3fd3', fontWeight: 700, textDecoration: 'none' }}>VIEW →</Link>
                    <button onClick={() => removeProduct(p.id)} disabled={actionId === p.id} style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, background: 'none', border: 'none', cursor: actionId === p.id ? 'not-allowed' : 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', opacity: actionId === p.id ? 0.5 : 1 }}>
                      {actionId === p.id ? '...' : 'REMOVE'}
                    </button>
                  </div>
                </div>
              ))}
              {products.filter(p => p.status !== 'pending').length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>No live listings yet.</div>}
            </div>
          </>
        )}

        {/* ── SERVICES TAB ── */}
        {!loadingData && activeTab === 'services' && (
          <>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', marginBottom: '16px' }}>
              LIVE SERVICES ({services.filter(s => s.status !== 'pending').length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {services.filter(s => s.status !== 'pending').map(s => (
                <div key={s.id} style={{ background: '#fff', border: '2px solid #eee', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>by {(s.provider as any)?.name ?? 'Unknown'} · {s.category} · {s.rate ?? 'No rate'}</div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{s.total_bookings} bookings · {new Date(s.created_at).toLocaleDateString('en-GB')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    <StatusBadge status={s.status} />
                    <button onClick={() => removeService(s.id)} disabled={actionId === s.id} style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, background: 'none', border: 'none', cursor: actionId === s.id ? 'not-allowed' : 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', opacity: actionId === s.id ? 0.5 : 1 }}>
                      {actionId === s.id ? '...' : 'REMOVE'}
                    </button>
                  </div>
                </div>
              ))}
              {services.filter(s => s.status !== 'pending').length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>No live services yet.</div>}
            </div>
          </>
        )}

        {/* ── REPORTS TAB ── */}
        {!loadingData && activeTab === 'reports' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px' }}>
                PENDING REPORTS ({reports.length})
              </div>
              <button
                onClick={loadReports}
                disabled={reportsLoading}
                style={{ padding: '8px 16px', border: '2px solid #111', background: '#fff', fontFamily: '"Archivo Black"', fontSize: '11px', cursor: reportsLoading ? 'not-allowed' : 'pointer', color: '#111', opacity: reportsLoading ? 0.6 : 1 }}
              >
                {reportsLoading ? '↻ LOADING...' : '↻ REFRESH'}
              </button>
            </div>

            {reportsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Loading reports...</div>
            ) : reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', border: '2px solid #111', background: '#fff', boxShadow: '6px 6px 0 #111' }}>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', color: '#1B5E20' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', marginBottom: '8px' }}>ALL CLEAR</div>
                <p style={{ color: '#888', fontSize: '14px' }}>No pending reports.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reports.map((report: any) => (
                  <div key={report.id} style={{ border: '2px solid #f59e0b', background: '#fffbeb', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '3px 10px', background: '#f59e0b', color: '#000', fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}>
                            {report.reason.toUpperCase().replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: '12px', color: '#888' }}>
                            {new Date(report.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#111', marginBottom: '4px' }}>
                          <strong>Reporter:</strong> {report.reporter?.name ?? 'Unknown'}
                        </div>
                        {report.product && (
                          <div style={{ fontSize: '13px', color: '#555' }}>
                            <strong>Listing:</strong>{' '}
                            <a href={`/goods/${report.product.id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1B5E20', fontWeight: 700 }}>
                              {report.product.title}
                            </a>
                          </div>
                        )}
                        {report.service && (
                          <div style={{ fontSize: '13px', color: '#555' }}>
                            <strong>Service:</strong>{' '}
                            <a href={`/services/${report.service.id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1B5E20', fontWeight: 700 }}>
                              {report.service.name}
                            </a>
                          </div>
                        )}
                        {report.reported_user && (
                          <div style={{ fontSize: '13px', color: '#555' }}>
                            <strong>Reported user:</strong> {report.reported_user.name ?? 'Unknown'}
                          </div>
                        )}
                        {report.details && (
                          <div style={{ marginTop: '8px', padding: '10px 14px', background: '#fff', border: '1px solid #f59e0b', fontSize: '13px', color: '#555', fontStyle: 'italic' }}>
                            &quot;{report.details}&quot;
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={() => resolveReport(report.id, 'resolved')}
                          disabled={actionId === report.id}
                          style={{ padding: '8px 16px', background: '#1B5E20', color: '#fff', fontFamily: '"Archivo Black"', fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #111', cursor: actionId === report.id ? 'not-allowed' : 'pointer', opacity: actionId === report.id ? 0.6 : 1 }}
                        >
                          RESOLVE
                        </button>
                        <button
                          onClick={() => resolveReport(report.id, 'dismissed')}
                          disabled={actionId === report.id}
                          style={{ padding: '8px 16px', background: '#fff', color: '#666', fontFamily: '"Archivo Black"', fontSize: '11px', letterSpacing: '0.5px', border: '2px solid #ddd', cursor: actionId === report.id ? 'not-allowed' : 'pointer', opacity: actionId === report.id ? 0.6 : 1 }}
                        >
                          DISMISS
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </SectionWrapper>
    </>
  )
}
