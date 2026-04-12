"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

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
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#1B5E20', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: Math.floor(size * 0.33), flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function MessagesInner() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const withId = searchParams.get('with')
  const productId = searchParams.get('product')
  const productTitle = searchParams.get('title')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activePartner, setActivePartner] = useState<string | null>(null)
  const [activePartnerProfile, setActivePartnerProfile] = useState<{ name: string; avatar_url: string | null; role?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

  // New message search
  const [showNewMsg, setShowNewMsg] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  // Track whether we've done the one-time URL-param setup (withId pre-fill)
  const didInitRef = useRef(false)
  // Mirror activePartner in a ref so loadConversations doesn't need it as a dep
  const activePartnerRef = useRef<string | null>(null)
  useEffect(() => { activePartnerRef.current = activePartner }, [activePartner])

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/messages')
  }, [user, authLoading, router])

  // Load conversations — ONLY depends on user. Never on input/activePartner.
  const loadConversations = useCallback(async () => {
    if (!user) return
    setLoadingConvs(true)

    const { data: msgs } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, content, is_read, created_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!msgs) { setLoadingConvs(false); return }

    const convMap = new Map<string, { last_message: string; last_time: string; unread: number }>()
    for (const msg of msgs) {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, {
          last_message: msg.content, last_time: msg.created_at,
          unread: (!msg.is_read && msg.receiver_id === user.id) ? 1 : 0,
        })
      } else if (!msg.is_read && msg.receiver_id === user.id) {
        convMap.get(partnerId)!.unread++
      }
    }

    const partnerIds = [...convMap.keys()]
    // Include the ?with= partner even if no messages yet (to show their profile)
    const extraId = withId && !convMap.has(withId) ? withId : null
    const allIds = extraId ? [...partnerIds, extraId] : partnerIds

    let profileMap = new Map<string, { name: string; avatar_url: string | null; role: string }>()
    if (allIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url, role').in('id', allIds)
      profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
    }

    const convList: Conversation[] = partnerIds.map(pid => {
      const conv = convMap.get(pid)!
      const p = profileMap.get(pid)
      return { partner_id: pid, partner_name: p?.name ?? 'Unknown', partner_avatar: p?.avatar_url ?? null, last_message: conv.last_message, last_time: conv.last_time, unread: conv.unread }
    })

    setConversations(convList)

    // Auto-open first conversation only when nothing is active yet
    if (!activePartnerRef.current && !withId && convList.length > 0) {
      setActivePartner(convList[0].partner_id)
    }

    setLoadingConvs(false)
  }, [user, withId])   // ← NO input / activePartner in deps

  useEffect(() => { loadConversations() }, [loadConversations])

  // One-time effect: handle ?with= URL param — set active partner + pre-fill input
  useEffect(() => {
    if (!withId || !user || didInitRef.current) return
    didInitRef.current = true
    setActivePartner(withId)
    setMobileView('chat')
    if (productTitle) {
      setInput(`Hi, I'm interested in your listing: ${decodeURIComponent(productTitle)}`)
    }
    // Fetch partner profile so name/avatar shows immediately before convos load
    supabase.from('profiles').select('id, name, avatar_url, role').eq('id', withId).single()
      .then(({ data }) => {
        if (data) setActivePartnerProfile({ name: data.name, avatar_url: data.avatar_url, role: data.role })
      })
  }, [withId, productTitle, user])

  const loadMessages = useCallback(async (partnerId: string) => {
    if (!user) return
    setLoadingMsgs(true)

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    setMessages(data ?? [])
    setLoadingMsgs(false)

    await supabase.from('messages').update({ is_read: true })
      .eq('sender_id', partnerId).eq('receiver_id', user.id).eq('is_read', false)
    setConversations(prev => prev.map(c => c.partner_id === partnerId ? { ...c, unread: 0 } : c))
  }, [user])

  useEffect(() => {
    if (activePartner) loadMessages(activePartner)
  }, [activePartner, loadMessages])

  // Realtime subscription
  useEffect(() => {
    if (!user || !activePartner) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`messages:${user.id}:${activePartner}`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload: any) => {
          const msg = payload.new as Message
          if (msg.sender_id === activePartner) {
            setMessages(prev => [...prev, msg])
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id)
          }
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [user, activePartner])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // User search for new conversations
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

  const openConversation = async (targetId: string, targetName: string, targetAvatar: string | null, targetRole: string) => {
    setActivePartner(targetId)
    setActivePartnerProfile({ name: targetName, avatar_url: targetAvatar, role: targetRole })
    setShowNewMsg(false)
    setUserSearch('')
    setSearchResults([])
    setMobileView('chat')
  }

  const sendMessage = async () => {
    if (!input.trim() || !user || !activePartner || sending) return
    setSending(true)
    const content = input.trim()
    const tempId = `opt_${Date.now()}`

    const optimisticMsg: Message = {
      id: tempId, sender_id: user.id, receiver_id: activePartner,
      content, is_read: false, created_at: new Date().toISOString(),
      product_id: productId ?? null,
    }
    setMessages(prev => [...prev, optimisticMsg])
    setInput('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activePartner, content, productId: productId ?? undefined }),
      })

      if (res.status === 429) {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setInput(content)
        setSending(false)
        return
      }

      if (res.ok) {
        const data: Message = await res.json()
        setMessages(prev => prev.map(m => m.id === tempId ? data : m))
        setConversations(prev => {
          const existing = prev.find(c => c.partner_id === activePartner)
          if (existing) return prev.map(c => c.partner_id === activePartner ? { ...c, last_message: content, last_time: data.created_at } : c)
          const partnerInfo = activePartnerProfile
          return [{ partner_id: activePartner, partner_name: partnerInfo?.name ?? 'Unknown', partner_avatar: partnerInfo?.avatar_url ?? null, last_message: content, last_time: data.created_at, unread: 0 }, ...prev]
        })
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setInput(content)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(content)
    }
    setSending(false)
  }

  const activeConv = conversations.find(c => c.partner_id === activePartner)
  const displayName = activeConv?.partner_name ?? activePartnerProfile?.name ?? '...'
  const displayAvatar = activeConv?.partner_avatar ?? activePartnerProfile?.avatar_url ?? null
  const displayRole = activePartnerProfile?.role ?? ''

  if (authLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ background: '#f8f8f8', minHeight: '80vh' }}>
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
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px', letterSpacing: '-1px' }}>MESSAGES</div>
          <p style={{ color: '#666', marginTop: '4px', fontSize: '13px' }}>Real-time chat — buyers, sellers and service providers</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
        {loadingConvs ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', background: '#1B5E20', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
            <span style={{ color: '#888', fontWeight: 600 }}>Loading conversations...</span>
          </div>
        ) : (
          <div
            className="msg-grid"
            style={{ border: '2px solid #111', boxShadow: '6px 6px 0 #111', background: '#fff', minHeight: '600px' }}
          >
            {/* ── Sidebar ── */}
            <aside
              className={`msg-sidebar${mobileView === 'chat' ? ' msg-sidebar-hidden' : ''}`}
              style={{ borderRight: '2px solid #111', overflowY: 'auto', maxHeight: '700px' }}
            >
              {/* Sidebar header */}
              <div style={{ padding: '12px 14px', borderBottom: '2px solid #111', background: '#f8f8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '11px', letterSpacing: '1px', color: '#888' }}>CONVERSATIONS</span>
                <button
                  onClick={() => { setShowNewMsg(v => !v); setUserSearch(''); setSearchResults([]) }}
                  style={{
                    background: showNewMsg ? '#111' : '#1B5E20', color: '#fff',
                    border: 'none', padding: '5px 12px',
                    fontFamily: '"Archivo Black", sans-serif', fontSize: '11px',
                    cursor: 'pointer', letterSpacing: '0.5px', flexShrink: 0,
                  }}
                >
                  {showNewMsg ? '✕ CANCEL' : '+ NEW'}
                </button>
              </div>

              {/* New message search panel */}
              {showNewMsg && (
                <div style={{ borderBottom: '2px solid #111', background: '#f0f7f0' }}>
                  <div style={{ padding: '10px 12px' }}>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search by name..."
                      style={{
                        width: '100%', padding: '8px 10px',
                        border: '2px solid #1B5E20', outline: 'none',
                        fontFamily: '"Space Grotesk", sans-serif', fontSize: '13px',
                        boxSizing: 'border-box', background: '#fff',
                      }}
                    />
                  </div>
                  {searching && (
                    <div style={{ padding: '6px 14px 10px', fontSize: '11px', color: '#888', fontWeight: 600 }}>Searching...</div>
                  )}
                  {searchResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => openConversation(u.id, u.name, u.avatar_url, u.role)}
                      style={{
                        display: 'flex', gap: '10px', alignItems: 'center',
                        width: '100%', padding: '10px 14px',
                        background: 'none', border: 'none',
                        borderBottom: '1px solid #d4edda',
                        cursor: 'pointer', textAlign: 'left',
                      }}
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

              {/* Current partner (pending first message) */}
              {activePartner && !conversations.find(c => c.partner_id === activePartner) && activePartnerProfile && (
                <button
                  onClick={() => { setActivePartner(activePartner); setMobileView('chat') }}
                  style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%', padding: '14px 16px',
                    background: '#e8f5e9', border: 'none', borderBottom: '1px solid #f0f0f0',
                    borderLeft: '3px solid #1B5E20', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Avatar url={activePartnerProfile.avatar_url} name={activePartnerProfile.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111', marginBottom: '2px' }}>{activePartnerProfile.name}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>New conversation</div>
                  </div>
                </button>
              )}

              {/* Conversation list */}
              {conversations.length === 0 && !activePartner && !showNewMsg && (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#aaa' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>💬</div>
                  <div style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px' }}>NO CONVERSATIONS YET</div>
                  <div style={{ fontSize: '11px', marginTop: '6px', lineHeight: 1.5 }}>Tap <strong style={{ color: '#1B5E20' }}>+ NEW</strong> to message anyone,<br />or browse listings and tap "Message Seller"</div>
                </div>
              )}
              {conversations.map(conv => (
                <button
                  key={conv.partner_id}
                  onClick={() => { setActivePartner(conv.partner_id); setMobileView('chat') }}
                  style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%', padding: '14px 16px',
                    background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', textAlign: 'left',
                    backgroundColor: activePartner === conv.partner_id ? '#e8f5e9' : 'transparent',
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
                      <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '16px' }}>{displayName}</div>
                      <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {displayRole || 'Student'}
                        {productTitle && ` · Re: ${decodeURIComponent(productTitle)}`}
                      </div>
                    </div>
                    {/* Link to their profile */}
                    <Link
                      href={`/profile/${activePartner}`}
                      style={{ fontSize: '11px', color: '#5d3fd3', fontWeight: 700, textDecoration: 'none', padding: '4px 8px', border: '1px solid #5d3fd3', flexShrink: 0 }}
                      title="View profile"
                    >
                      PROFILE
                    </Link>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', minHeight: '400px' }}>
                    {loadingMsgs ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>👋</div>
                        <div style={{ fontWeight: 600 }}>Say hello to get started!</div>
                        <div style={{ fontSize: '12px', marginTop: '6px' }}>You can talk about listings, prices, delivery — anything.</div>
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isMine = msg.sender_id === user.id
                        return (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                            {!isMine && <Avatar url={displayAvatar} name={displayName} size={28} />}
                            <div style={{
                              maxWidth: '68%',
                              background: isMine ? '#111' : '#f0f0f0',
                              color: isMine ? '#fff' : '#111',
                              padding: '10px 14px',
                              borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              wordBreak: 'break-word',
                            }}>
                              <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0 }}>{msg.content}</p>
                              <p style={{ fontSize: '10px', marginTop: '4px', opacity: 0.6, textAlign: 'right', margin: '4px 0 0' }}>{formatTime(msg.created_at)}</p>
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
                      style={{
                        flex: 1, padding: '12px 16px',
                        border: '2px solid #111', outline: 'none',
                        fontFamily: '"Space Grotesk", sans-serif', fontSize: '14px',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#1B5E20')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#111')}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      style={{
                        padding: '12px 24px',
                        background: (!input.trim() || sending) ? '#888' : '#1B5E20',
                        color: '#fff', border: '2px solid #111',
                        fontFamily: '"Archivo Black", sans-serif', fontSize: '13px',
                        cursor: (!input.trim() || sending) ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {sending ? '...' : 'SEND →'}
                    </button>
                  </div>
                </>
              ) : (
                /* No active conversation — welcome/empty state */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', color: '#888', textAlign: 'center' }}>
                  <div style={{ fontSize: '56px', marginBottom: '16px' }}>💬</div>
                  <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '22px', color: '#111', marginBottom: '10px' }}>
                    START A CONVERSATION
                  </div>
                  <p style={{ fontSize: '14px', maxWidth: '320px', lineHeight: 1.7, marginBottom: '24px' }}>
                    Pick someone from the left, or hit <strong style={{ color: '#1B5E20' }}>+ NEW</strong> to message any buyer, seller, or service provider on campus.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      onClick={() => { setShowNewMsg(true) }}
                      style={{ padding: '10px 20px', background: '#1B5E20', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', border: '2px solid #111', cursor: 'pointer', boxShadow: '3px 3px 0 #111' }}
                    >
                      + NEW MESSAGE
                    </button>
                    <Link href="/goods" style={{ padding: '10px 20px', border: '2px solid #111', fontWeight: 700, fontSize: '12px', textDecoration: 'none', color: '#111', boxShadow: '3px 3px 0 #888', display: 'inline-block' }}>
                      BROWSE GOODS
                    </Link>
                    <Link href="/services" style={{ padding: '10px 20px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', textDecoration: 'none', border: '2px solid #111', boxShadow: '3px 3px 0 #888', display: 'inline-block' }}>
                      BROWSE SERVICES
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', color: '#888' }}>Loading...</div>
      </div>
    }>
      <MessagesInner />
    </Suspense>
  )
}
