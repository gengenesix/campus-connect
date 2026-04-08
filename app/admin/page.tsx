"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

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
  created_at: string
  seller: { name: string | null } | null
}

function initials(name: string | null) {
  return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
}

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'users' | 'listings'>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ users: 0, verified: 0, listings: 0, services: 0 })
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.replace('/')
    }
  }, [user, profile, loading, router])

  const loadData = useCallback(async () => {
    if (!user || profile?.role !== 'admin') return
    setLoadingData(true)

    const [usersRes, productsRes, servicesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('products')
        .select('id, title, price, status, condition, category, views, created_at, seller:profiles!seller_id(name)')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false }),
      supabase.from('services').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
    ])

    const allUsers = (usersRes.data as AdminUser[]) ?? []
    setUsers(allUsers)
    setProducts((productsRes.data as unknown as AdminProduct[]) ?? [])
    setStats({
      users: allUsers.length,
      verified: allUsers.filter(u => u.is_verified).length,
      listings: productsRes.data?.length ?? 0,
      services: servicesRes.count ?? 0,
    })
    setLoadingData(false)
  }, [user, profile])

  useEffect(() => { loadData() }, [loadData])

  const toggleVerify = async (userId: string, currentState: boolean) => {
    setVerifyingId(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !currentState })
      .eq('id', userId)

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !currentState } : u))
      setStats(prev => ({ ...prev, verified: prev.verified + (currentState ? -1 : 1) }))
      showToast(currentState ? 'Verification removed.' : '✓ User verified successfully!')
    } else {
      showToast(`Error: ${error.message}`)
    }
    setVerifyingId(null)
  }

  const filteredUsers = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (u.name?.toLowerCase().includes(q) ?? false) ||
      u.email.toLowerCase().includes(q) ||
      (u.department?.toLowerCase().includes(q) ?? false) ||
      (u.course?.toLowerCase().includes(q) ?? false)
    )
  })

  const unverifiedCount = filteredUsers.filter(u => !u.is_verified).length

  if (loading || !user || profile?.role !== 'admin') return null

  return (
    <div style={{ background: '#f8f8f8', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '28px 20px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px', letterSpacing: '-1px' }}>
                ADMIN PANEL
              </div>
              <span style={{ background: '#ff3366', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 10px', letterSpacing: '1px' }}>
                SUPER ADMIN
              </span>
            </div>
            <p style={{ color: '#666', fontSize: '13px' }}>
              Campus Connect · {profile?.name ?? user.email}
            </p>
          </div>
          <Link
            href="/dashboard"
            style={{ padding: '10px 20px', border: '2px solid #444', color: '#ccc', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', textDecoration: 'none', letterSpacing: '0.5px' }}
          >
            ← DASHBOARD
          </Link>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          background: toast.startsWith('Error') ? '#fee2e2' : '#dcfce7',
          borderBottom: `2px solid ${toast.startsWith('Error') ? '#ef4444' : '#16a34a'}`,
          padding: '10px 24px', textAlign: 'center', fontWeight: 700, fontSize: '14px',
          color: toast.startsWith('Error') ? '#dc2626' : '#15803d',
        }}>
          {toast}
        </div>
      )}

      <div className="container" style={{ paddingTop: '28px', paddingBottom: '60px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'TOTAL USERS', value: stats.users, color: '#5d3fd3' },
            { label: 'VERIFIED', value: stats.verified, color: '#1B5E20' },
            { label: 'LISTINGS', value: stats.listings, color: '#111' },
            { label: 'SERVICES', value: stats.services, color: '#ff3366' },
          ].map(stat => (
            <div key={stat.label} style={{ border: '2px solid #111', background: '#fff', padding: '20px', boxShadow: '4px 4px 0 #111' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginTop: '6px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Admin note */}
        <div style={{ background: '#fff8e1', border: '2px solid #f59e0b', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#92400e' }}>
          <strong>How to give someone admin access:</strong> Go to Supabase → Table Editor → profiles → find the user → set <code>role = 'admin'</code>. They will then see this panel.
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #111', marginBottom: '24px' }}>
          {(['users', 'listings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 28px',
                background: activeTab === tab ? '#111' : '#fff',
                color: activeTab === tab ? '#fff' : '#666',
                border: '2px solid #111', borderBottom: 'none',
                fontFamily: '"Archivo Black", sans-serif',
                fontSize: '12px', letterSpacing: '1px',
                cursor: 'pointer', marginBottom: '-2px',
              }}
            >
              {tab === 'users' ? `USERS (${stats.users})` : `LISTINGS (${stats.listings})`}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontWeight: 600 }}>
            Loading data...
          </div>
        ) : activeTab === 'users' ? (
          <>
            {/* Search */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search by name, email, department, course..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px', outline: 'none' }}
              />
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#888', whiteSpace: 'nowrap' }}>
                {filteredUsers.length} users
              </span>
            </div>

            {unverifiedCount > 0 && (
              <div style={{ background: '#fff8e1', border: '2px solid #f59e0b', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
                ⚠️ {unverifiedCount} user{unverifiedCount !== 1 ? 's' : ''} awaiting verification
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '52px 1fr auto',
                    gap: '16px',
                    alignItems: 'center',
                    background: '#fff',
                    border: u.is_verified ? '2px solid #e0e0e0' : '2px solid #fbbf24',
                    padding: '14px 16px',
                    borderLeft: u.is_verified ? '4px solid #1B5E20' : '4px solid #f59e0b',
                  }}
                >
                  {/* Avatar */}
                  <div style={{ flexShrink: 0 }}>
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.name ?? ''}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                        {initials(u.name)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>
                        {u.name ?? 'No name set'}
                      </span>
                      {u.is_verified && (
                        <span
                          title="Verified"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '17px', height: '17px',
                            background: '#1d9bf0', borderRadius: '50%',
                            fontSize: '10px', color: '#fff', fontWeight: 900,
                          }}
                        >✓</span>
                      )}
                      <span style={{
                        background: u.role === 'admin' ? '#ff3366' : u.role === 'seller' ? '#5d3fd3' : u.role === 'provider' ? '#1B5E20' : '#888',
                        color: '#fff', fontSize: '10px', fontWeight: 700,
                        padding: '2px 8px', letterSpacing: '0.5px',
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{u.email}</div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {[u.department, u.course, u.class_year, u.phone ? `📱 ${u.phone}` : null]
                        .filter(Boolean).join(' · ')}
                    </div>
                    <div style={{ fontSize: '10px', color: '#bbb', marginTop: '2px' }}>
                      Joined {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Verify Action */}
                  <div style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => toggleVerify(u.id, u.is_verified)}
                      disabled={verifyingId === u.id || u.role === 'admin'}
                      style={{
                        padding: '9px 18px',
                        background: u.is_verified ? '#fff' : '#1d9bf0',
                        color: u.is_verified ? '#dc2626' : '#fff',
                        border: u.is_verified ? '2px solid #dc2626' : '2px solid #1d9bf0',
                        fontFamily: '"Archivo Black", sans-serif',
                        fontSize: '11px', letterSpacing: '0.5px',
                        cursor: (verifyingId === u.id || u.role === 'admin') ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        opacity: u.role === 'admin' ? 0.4 : 1,
                      }}
                    >
                      {verifyingId === u.id ? '...' : u.is_verified ? '✕ REVOKE' : '✓ VERIFY'}
                    </button>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                  No users match your search.
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', marginBottom: '16px' }}>
              ALL LISTINGS ({products.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {products.map(p => (
                <div key={p.id} style={{ background: '#fff', border: '2px solid #eee', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      by {(p.seller as any)?.name ?? 'Unknown'} · GHS {p.price} · {p.condition} · {p.category}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {p.views} views · {new Date(p.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{
                      background: p.status === 'active' ? '#dcfce7' : '#fee2e2',
                      color: p.status === 'active' ? '#15803d' : '#dc2626',
                      fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                      border: '1px solid currentColor',
                    }}>
                      {p.status.toUpperCase()}
                    </span>
                    <Link
                      href={`/goods/${p.id}`}
                      style={{ fontSize: '12px', color: '#5d3fd3', fontWeight: 700, textDecoration: 'none' }}
                    >
                      VIEW →
                    </Link>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                  No listings yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
