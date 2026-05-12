"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import SectionWrapper from '@/components/ui/SectionWrapper'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  product_id?: string | null
}

interface Conversation {
  partner_id: string
  partner_name: string
  partner_avatar: string | null
  last_message: string
  last_time: string
  unread: number
}

interface UserResult {
  id: string
  name: string
  avatar_url: string | null
  role: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ url, name, size = 42 }: { url: string | null; name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  if (url) {
    return (
      <Image
        src={url} alt={name} width={size} height={size}
        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #eee' }}
        onError={(e: any) => { e.currentTarget.style.display = 'none' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#1B5E20', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: Math.floor(size * 0.33), flexShrink: 0,
      border: '2px solid #eee',
    }}>
      {initials}
    </div>
  )
}

// Skeleton row shown while conversations load for the first time
function ConvSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#eee', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, background: '#eee', borderRadius: 4, width: '60%', marginBottom: 6 }} />
        <div style={{ height: 10, background: '#f4f4f4', borderRadius: 4, width: '80%' }} />
      </div>
    </div>
  )
}

// ─── Cache helpers ───────────────────────────────────────────────────────────

function cacheKey(userId: string) { return `cc_convs_${userId}` }

function loadCached(userId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(cacheKey(userId))
    if (!raw) return []
    return JSON.parse(raw) as Conversation[]
  } catch { return [] }
}

function saveCache(userId: string, convs: Conversation[]) {
  try { localStorage.setItem(cacheKey(userId), JSON.stringify(convs)) } catch {}
}

// ─── Main component ──────────────────────────────────────────────────────────

function MessagesInner() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const withId       = searchParams.get('with')
  const productId    = searchParams.get('product')
  const productTitle = searchParams.get('title')

  // Conversations list — seeded from cache immediately so PWA has no blank flash
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window === 'undefined') return []
    // We don't have userId yet on first render — we'll load properly in effects
    return []
  })
  const [activePartner,        setActivePartner]        = useState<string | null>(null)
  const [activePartnerProfile, setActivePartnerProfile] = useState<{ name: string; avatar_url: string | null; role?: string } | null>(null)
  const [messages,    setMessages]    = useState<Message[]>([])
  const [input,       setInput]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [convLoading, setConvLoading] = useState(true)   // true only when NO cached data
  const [msgLoading,  setMsgLoading]  = useState(false)
  const [mobileView,  setMobileView]  = useState<'list' | 'chat'>('list')
  const [rtPaused,    setRtPaused]    = useState(false)

  // New-message search
  const [showNewMsg,    setShowNewMsg]    = useState(false)
  const [userSearch,    setUserSearch]    = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [searching,     setSearching]     = useState(false)

  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const inboxRef        = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const outboxRef       = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const searchInputRef  = useRef<HTMLInputElement>(null)
  const didInitRef      = useRef(false)
  const activePartnerRef = useRef<string | null>(null)
  useEffect(() => { activePartnerRef.current = activePartner }, [activePartner])

  // ── Auth redirect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/messages')
  }, [user, authLoading, router])

  // ── Load conversations (fast path: RPC + localStorage cache) ───────────────
  const loadConversations = useCallback(async (silent = false) => {
    if (!user) return
    if (!silent) setConvLoading(true)

    // 1. Try fast RPC first (get_conversations uses DISTINCT ON — O(conversations))
    const { data: rpcData, error: rpcErr } = await supabase
      .rpc('get_conversations', { p_user_id: user.id })

    if (rpcErr) {
      // Fallback: direct query with a hard limit so we never fetch unbounded rows
      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, is_read, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(400)

      if (!msgs) { setConvLoading(false); return }

      const convMap = new Map<string, { last_message: string; last_time: string; unread: number }>()
      for (const msg of msgs) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            last_message: msg.content,
            last_time: msg.created_at,
            unread: (!msg.is_read && msg.receiver_id === user.id) ? 1 : 0,
          })
        } else if (!msg.is_read && msg.receiver_id === user.id) {
          convMap.get(partnerId)!.unread++
        }
      }

      const partnerIds = [...convMap.keys()]
      const extraId    = withId && !convMap.has(withId) ? withId : null
      const allIds     = extraId ? [...partnerIds, extraId] : partnerIds

      let profileMap = new Map<string, { name: string; avatar_url: string | null; role: string }>()
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles').select('id, name, avatar_url, role').in('id', allIds)
        profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
      }

      const convList: Conversation[] = partnerIds.map(pid => {
        const conv = convMap.get(pid)!
        const p    = profileMap.get(pid)
        return { partner_id: pid, partner_name: p?.name ?? 'Unknown', partner_avatar: p?.avatar_url ?? null, last_message: conv.last_message, last_time: conv.last_time, unread: conv.unread }
      })

      setConversations(convList)
      saveCache(user.id, convList)
      if (!activePartnerRef.current && !withId && convList.length > 0) {
        setActivePartner(convList[0].partner_id)
      }
      setConvLoading(false)
      return
    }

    // RPC succeeded — fetch profiles for all partners
    const partnerIds: string[] = (rpcData ?? []).map((r: any) => r.partner_id)
    const extraId = withId && !partnerIds.includes(withId) ? withId : null
    const allIds  = extraId ? [...partnerIds, extraId] : partnerIds

    let profileMap = new Map<string, { name: string; avatar_url: string | null; role: string }>()
    if (allIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles').select('id, name, avatar_url, role').in('id', allIds)
      profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
    }

    const convList: Conversation[] = (rpcData ?? []).map((r: any) => {
      const p = profileMap.get(r.partner_id)
      return {
        partner_id:     r.partner_id,
        partner_name:   p?.name ?? 'Unknown',
        partner_avatar: p?.avatar_url ?? null,
        last_message:   r.last_message,
        last_time:      r.last_time,
        unread:         Number(r.unread_count),
      }
    })

    setConversations(convList)
    saveCache(user.id, convList)

    if (!activePartnerRef.current && !withId && convList.length > 0) {
      setActivePartner(convList[0].partner_id)
    }
    setConvLoading(false)
  }, [user, withId])

  // Seed from cache immediately so UI renders before network
  useEffect(() => {
    if (!user) return
    const cached = loadCached(user.id)
    if (cached.length > 0) {
      setConversations(cached)
      setConvLoading(false)                    // no spinner if we have cached data
      if (!activePartnerRef.current && !withId) setActivePartner(cached[0].partner_id)
    }
    loadConversations(cached.length > 0)       // silent refresh if cache hit
  }, [user])                                   // eslint-disable-line react-hooks/exhaustive-deps

  // Page Visibility API — pause Realtime when tab is hidden, refresh when it returns.
  // This prevents connection pool exhaustion: at 1,000 users × 2 channels = 2,000 connections.
  // With this, backgrounded tabs drop their subscriptions and reconnect on focus.
  useEffect(() => {
    const handler = () => {
      const hidden = document.hidden
      setRtPaused(hidden)
      if (!hidden) loadConversations(true)
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [loadConversations])

  // ── One-time URL-param setup ───────────────────────────────────────────────
  useEffect(() => {
    if (!withId || !user || didInitRef.current) return
    didInitRef.current = true
    setActivePartner(withId)
    setMobileView('chat')
    if (productTitle) setInput(`Hi, I'm interested in your listing: ${decodeURIComponent(productTitle)}`)
    supabase.from('profiles').select('id, name, avatar_url, role').eq('id', withId).single()
      .then(({ data }) => { if (data) setActivePartnerProfile({ name: data.name, avatar_url: data.avatar_url, role: data.role }) })
  }, [withId, productTitle, user])

  // ── Load messages for active conversation ─────────────────────────────────
  const loadMessages = useCallback(async (partnerId: string) => {
    if (!user) return
    setMsgLoading(true)

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(100)                              // never unbounded

    setMessages(data ?? [])
    setMsgLoading(false)

    // Mark all unread from this partner as read
    supabase.from('messages')
      .update({ is_read: true })
      .eq('sender_id', partnerId).eq('receiver_id', user.id).eq('is_read', false)
      .then(() => {
        setConversations(prev => prev.map(c => c.partner_id === partnerId ? { ...c, unread: 0 } : c))
      })
  }, [user])

  useEffect(() => {
    if (activePartner) loadMessages(activePartner)
  }, [activePartner, loadMessages])

  // ── Global Realtime channels ───────────────────────────────────────────────
  // Inbox: ALL messages addressed to this user (not just active partner)
  // Outbox: messages sent by this user on other devices
  // Paused when tab is hidden (Page Visibility API) to conserve connection budget.
  useEffect(() => {
    if (!user) return

    // Disconnect when tab is hidden — prevents pool exhaustion at scale
    if (rtPaused) {
      if (inboxRef.current)  { supabase.removeChannel(inboxRef.current);  inboxRef.current  = null }
      if (outboxRef.current) { supabase.removeChannel(outboxRef.current); outboxRef.current = null }
      return
    }

    // Clean up any previous channels
    if (inboxRef.current)  supabase.removeChannel(inboxRef.current)
    if (outboxRef.current) supabase.removeChannel(outboxRef.current)

    // ── INBOX ──
    inboxRef.current = supabase
      .channel(`inbox:${user.id}`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload: any) => {
          const msg = payload.new as Message
          const from = msg.sender_id

          // Add to chat if this conversation is open
          if (from === activePartnerRef.current) {
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id)
          }

          // Update conversation list (bump to top, increment unread if not open)
          setConversations(prev => {
            const isActive = from === activePartnerRef.current
            const existing = prev.find(c => c.partner_id === from)
            const updated: Conversation = existing
              ? { ...existing, last_message: msg.content, last_time: msg.created_at, unread: isActive ? 0 : existing.unread + 1 }
              : { partner_id: from, partner_name: '...', partner_avatar: null, last_message: msg.content, last_time: msg.created_at, unread: isActive ? 0 : 1 }

            const next = [updated, ...prev.filter(c => c.partner_id !== from)]

            // Fetch profile lazily if this is a new conversation
            if (!existing) {
              supabase.from('profiles').select('id, name, avatar_url, role').eq('id', from).single()
                .then(({ data: p }) => {
                  if (p) {
                    setConversations(c2 => c2.map(c => c.partner_id === from
                      ? { ...c, partner_name: p.name ?? 'Unknown', partner_avatar: p.avatar_url }
                      : c
                    ))
                  }
                })
            }
            return next
          })
        }
      )
      .subscribe()

    // ── OUTBOX (cross-device sync) ──
    outboxRef.current = supabase
      .channel(`outbox:${user.id}`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` },
        (payload: any) => {
          const msg = payload.new as Message
          const to  = msg.receiver_id

          if (to === activePartnerRef.current) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev
              // Replace matching optimistic message (race: RT fired before API response)
              const optIdx = prev.findIndex(m => m.id.startsWith('opt_') && m.content === msg.content)
              if (optIdx !== -1) return prev.map((m, i) => i === optIdx ? msg : m)
              return [...prev, msg]
            })
          }

          // Keep conversation last_message fresh on other devices
          setConversations(prev => prev.map(c => c.partner_id === to
            ? { ...c, last_message: msg.content, last_time: msg.created_at }
            : c
          ))
        }
      )
      .subscribe()

    return () => {
      if (inboxRef.current)  supabase.removeChannel(inboxRef.current)
      if (outboxRef.current) supabase.removeChannel(outboxRef.current)
    }
  }, [user, rtPaused])   // reconnect when tab regains focus

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── User search ────────────────────────────────────────────────────────────
  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim() || !user) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, role')
      .ilike('name', `%${q}%`)
      .neq('id', user.id)
      .neq('is_banned', true)
      .limit(8)
    setSearchResults(data ?? [])
    setSearching(false)
  }, [user])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 350)
    return () => clearTimeout(t)
  }, [userSearch, searchUsers])

  useEffect(() => {
    if (showNewMsg) setTimeout(() => searchInputRef.current?.focus(), 80)
  }, [showNewMsg])

  // ── Open conversation ──────────────────────────────────────────────────────
  const openConversation = (targetId: string, targetName: string, targetAvatar: string | null, targetRole: string) => {
    setActivePartner(targetId)
    setActivePartnerProfile({ name: targetName, avatar_url: targetAvatar, role: targetRole })
    setShowNewMsg(false)
    setUserSearch('')
    setSearchResults([])
    setMobileView('chat')
  }

  // ── Send message via secured API route ────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !user || !activePartner || sending) return
    const content = input.trim()
    if (content.length > 2000) return

    // Block immediately if offline
    if (!navigator.onLine) {
      toast.error('No internet connection — reconnect and try again.')
      return
    }

    setSending(true)
    const tempId = `opt_${Date.now()}`
    const optimistic: Message = {
      id: tempId, sender_id: user.id, receiver_id: activePartner,
      content, is_read: false, created_at: new Date().toISOString(),
      product_id: productId ?? null,
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activePartner, content, productId: productId ?? undefined }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to send' }))
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setInput(content)
        const msg = err.error ?? 'Failed to send message'
        toast.error(
          res.status === 401 ? 'Session expired — please sign in again.' :
          res.status === 403 ? msg :
          res.status === 429 ? 'Too many messages — slow down a bit.' :
          msg
        )
      } else {
        const savedMsg = await res.json() as Message
        setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m))
        setConversations(prev => {
          const existing = prev.find(c => c.partner_id === activePartner)
          const updated: Conversation = existing
            ? { ...existing, last_message: content, last_time: savedMsg.created_at }
            : { partner_id: activePartner, partner_name: activePartnerProfile?.name ?? 'Unknown', partner_avatar: activePartnerProfile?.avatar_url ?? null, last_message: content, last_time: savedMsg.created_at, unread: 0 }
          return [updated, ...prev.filter(c => c.partner_id !== activePartner)]
        })
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(content)
      toast.error(navigator.onLine ? 'Failed to send — try again.' : 'No internet connection.')
    }
    setSending(false)
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const activeConv    = conversations.find(c => c.partner_id === activePartner)
  const displayName   = activeConv?.partner_name   ?? activePartnerProfile?.name        ?? '...'
  const displayAvatar = activeConv?.partner_avatar ?? activePartnerProfile?.avatar_url  ?? null
  const displayRole   = activePartnerProfile?.role ?? ''

  // ── Render guards ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: '"Syne", sans-serif', color: '#888' }}>Loading...</div>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .msg-grid { display: grid; grid-template-columns: 300px 1fr; }
        .msg-sidebar { display: flex; flex-direction: column; }
        .msg-chat { display: flex; flex-direction: column; }
        @media (max-width: 700px) {
          .msg-grid { grid-template-columns: 1fr !important; }
          .msg-sidebar-hidden { display: none !important; }
          .msg-chat-hidden { display: none !important; }
          .msg-back { display: block !important; }
        }
      `}</style>

      <div style={{ background: '#111', color: '#fff', padding: '28px 20px' }}>
        <div className="container">
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '32px', letterSpacing: '-1px' }}>MESSAGES</div>
          <p style={{ color: '#666', marginTop: '4px', fontSize: '13px' }}>Real-time chat — buyers, sellers and service providers</p>
        </div>
      </div>

      <SectionWrapper className="bg-[#f8f8f8]">
        <div
          className="msg-grid"
          style={{ border: '2px solid #111', boxShadow: '6px 6px 0 #111', background: '#fff', minHeight: '600px' }}
        >
          {/* ── Sidebar ── */}
          <aside
            className={`msg-sidebar${mobileView === 'chat' ? ' msg-sidebar-hidden' : ''}`}
            style={{ borderRight: '2px solid #111', overflowY: 'auto', maxHeight: '700px' }}
          >
            {/* Header */}
            <div style={{ padding: '12px 14px', borderBottom: '2px solid #111', background: '#f8f8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '11px', letterSpacing: '1px', color: '#888' }}>CONVERSATIONS</span>
              <button
                onClick={() => { setShowNewMsg(v => !v); setUserSearch(''); setSearchResults([]) }}
                style={{
                  background: showNewMsg ? '#111' : '#1B5E20', color: '#fff',
                  border: 'none', padding: '5px 12px',
                  fontFamily: '"Syne", sans-serif', fontSize: '11px',
                  cursor: 'pointer', letterSpacing: '0.5px', flexShrink: 0,
                }}
              >
                {showNewMsg ? '✕ CANCEL' : '+ NEW'}
              </button>
            </div>

            {/* New message search */}
            {showNewMsg && (
              <div style={{ borderBottom: '2px solid #111', background: '#f0f7f0' }}>
                <div style={{ padding: '10px 12px' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name..."
                    style={{ width: '100%', padding: '8px 10px', border: '2px solid #1B5E20', outline: 'none', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px', boxSizing: 'border-box', background: '#fff' }}
                  />
                </div>
                {searching && <div style={{ padding: '6px 14px 10px', fontSize: '11px', color: '#888', fontWeight: 600 }}>Searching...</div>}
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => openConversation(u.id, u.name, u.avatar_url, u.role)}
                    style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #d4edda', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e8f5e9')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <Avatar url={u.avatar_url} name={u.name} size={36} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>{u.name}</div>
                      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{u.role}</div>
                    </div>
                  </button>
                ))}
                {!searching && userSearch.length > 0 && searchResults.length === 0 && (
                  <div style={{ padding: '10px 14px 14px', fontSize: '12px', color: '#888', textAlign: 'center' }}>No users found for "{userSearch}"</div>
                )}
                {!userSearch && !searching && (
                  <div style={{ padding: '6px 14px 12px', fontSize: '11px', color: '#888' }}>Type a name to find someone to message</div>
                )}
              </div>
            )}

            {/* Pending first-message partner */}
            {activePartner && !conversations.find(c => c.partner_id === activePartner) && activePartnerProfile && (
              <button
                onClick={() => { setActivePartner(activePartner); setMobileView('chat') }}
                style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%', padding: '14px 16px', background: '#e8f5e9', border: 'none', borderBottom: '1px solid #f0f0f0', borderLeft: '3px solid #1B5E20', cursor: 'pointer', textAlign: 'left' }}
              >
                <Avatar url={activePartnerProfile.avatar_url} name={activePartnerProfile.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#111', marginBottom: '2px' }}>{activePartnerProfile.name}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>New conversation</div>
                </div>
              </button>
            )}

            {/* Skeleton while loading (only when no cache) */}
            {convLoading && conversations.length === 0 && (
              <>{[0,1,2].map(i => <ConvSkeleton key={i} />)}</>
            )}

            {/* Empty state */}
            {!convLoading && conversations.length === 0 && !activePartner && !showNewMsg && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#aaa' }}>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', color: '#ccc' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px' }}>NO CONVERSATIONS YET</div>
                <div style={{ fontSize: '11px', marginTop: '6px', lineHeight: 1.5 }}>Tap <strong style={{ color: '#1B5E20' }}>+ NEW</strong> to message anyone,<br />or browse listings and tap "Message Seller"</div>
              </div>
            )}

            {/* Conversation list */}
            {conversations.map(conv => (
              <button
                key={conv.partner_id}
                onClick={() => { setActivePartner(conv.partner_id); setActivePartnerProfile(null); setMobileView('chat') }}
                style={{
                  display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%', padding: '14px 16px',
                  background: activePartner === conv.partner_id ? '#e8f5e9' : 'transparent',
                  border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', textAlign: 'left',
                  borderLeft: activePartner === conv.partner_id ? '3px solid #1B5E20' : '3px solid transparent',
                  transition: '0.1s',
                }}
              >
                <Avatar url={conv.partner_avatar} name={conv.partner_name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{conv.partner_name}</span>
                    <span style={{ fontSize: '11px', color: '#999' }}>{timeAgo(conv.last_time)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message}</div>
                </div>
                {conv.unread > 0 && (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1B5E20', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {conv.unread}
                  </div>
                )}
              </button>
            ))}
          </aside>

          {/* ── Chat Panel ── */}
          <div
            className={`msg-chat${mobileView === 'list' ? ' msg-chat-hidden' : ''}`}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {activePartner ? (
              <>
                {/* Chat header */}
                <div style={{ padding: '14px 20px', borderBottom: '2px solid #111', background: '#f8f8f8', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setMobileView('list')}
                    className="msg-back"
                    style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '18px', color: '#111', padding: '0 8px 0 0' }}
                  >←</button>
                  <Avatar url={displayAvatar} name={displayName} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '16px' }}>{displayName}</div>
                    <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {displayRole || 'Student'}
                      {productTitle && ` · Re: ${decodeURIComponent(productTitle)}`}
                    </div>
                  </div>
                  <Link
                    href={`/profile/${activePartner}`}
                    style={{ fontSize: '11px', color: '#5d3fd3', fontWeight: 700, textDecoration: 'none', padding: '4px 8px', border: '1px solid #5d3fd3', flexShrink: 0 }}
                    title="View profile"
                  >
                    PROFILE
                  </Link>
                </div>

                {/* Messages area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', minHeight: '400px' }}>
                  {msgLoading ? (
                    // Skeleton messages while loading
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
                      {[70, 50, 80, 45, 65].map((w, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                          <div style={{ height: 36, width: `${w}%`, maxWidth: '68%', background: '#f0f0f0', borderRadius: 12, animation: 'pulse 1.2s ease-in-out infinite' }} />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', color: '#ccc' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                      </div>
                      <div style={{ fontWeight: 600 }}>Say hello to get started!</div>
                      <div style={{ fontSize: '12px', marginTop: '6px' }}>You can talk about listings, prices, delivery — anything.</div>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMine  = msg.sender_id === user.id
                      const isOpt   = msg.id.startsWith('opt_')
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                          {!isMine && <Avatar url={displayAvatar} name={displayName} size={28} />}
                          <div style={{
                            maxWidth: '68%',
                            background: isMine ? '#111' : '#f0f0f0',
                            color: isMine ? '#fff' : '#111',
                            padding: '10px 14px',
                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            opacity: isOpt ? 0.7 : 1,
                            wordBreak: 'break-word',
                            transition: 'opacity 0.2s',
                          }}>
                            <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0 }}>{msg.content}</p>
                            <p style={{ fontSize: '10px', marginTop: '4px', opacity: 0.6, textAlign: 'right', margin: '4px 0 0' }}>
                              {isOpt ? 'Sending…' : formatTime(msg.created_at)}
                            </p>
                          </div>
                          {isMine && <Avatar url={profile?.avatar_url ?? null} name={profile?.name ?? 'Me'} size={28} />}
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: '14px 16px', borderTop: '2px solid #111', display: 'flex', gap: '10px', background: '#fff' }}>
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Type a message... (Enter to send)"
                    maxLength={2000}
                    style={{ flex: 1, padding: '12px 16px', border: '2px solid #111', outline: 'none', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px' }}
                    onFocus={e  => (e.currentTarget.style.borderColor = '#1B5E20')}
                    onBlur={e   => (e.currentTarget.style.borderColor = '#111')}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    style={{
                      padding: '12px 24px',
                      background: (!input.trim() || sending) ? '#888' : '#1B5E20',
                      color: '#fff', border: '2px solid #111',
                      fontFamily: '"Syne", sans-serif', fontSize: '13px',
                      cursor: (!input.trim() || sending) ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {sending ? '...' : 'SEND →'}
                  </button>
                </div>
              </>
            ) : (
              /* No active conversation */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', color: '#888', textAlign: 'center' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: '#ddd' }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', color: '#111', marginBottom: '10px' }}>START A CONVERSATION</div>
                <p style={{ fontSize: '14px', maxWidth: '320px', lineHeight: 1.7, marginBottom: '24px' }}>
                  Pick someone from the left, or hit <strong style={{ color: '#1B5E20' }}>+ NEW</strong> to message any buyer, seller, or service provider on campus.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button onClick={() => setShowNewMsg(true)} style={{ padding: '10px 20px', background: '#1B5E20', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '12px', border: '2px solid #111', cursor: 'pointer', boxShadow: '3px 3px 0 #111' }}>
                    + NEW MESSAGE
                  </button>
                  <Link href="/goods"    style={{ padding: '10px 20px', border: '2px solid #111', fontWeight: 700, fontSize: '12px', textDecoration: 'none', color: '#111', boxShadow: '3px 3px 0 #888', display: 'inline-block' }}>BROWSE GOODS</Link>
                  <Link href="/services" style={{ padding: '10px 20px', background: '#111', color: '#fff', fontFamily: '"Syne", sans-serif', fontSize: '12px', textDecoration: 'none', border: '2px solid #111', boxShadow: '3px 3px 0 #888', display: 'inline-block' }}>BROWSE SERVICES</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', color: '#888' }}>Loading...</div>
      </div>
    }>
      <MessagesInner />
    </Suspense>
  )
}
