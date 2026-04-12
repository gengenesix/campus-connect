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

function MessagesInner() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const withId = searchParams.get('with')       // pre-open a conversation
  const productId = searchParams.get('product') // attach to product
  const productTitle = searchParams.get('title') // display context

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activePartner, setActivePartner] = useState<string | null>(null)
  const [activePartnerProfile, setActivePartnerProfile] = useState<{ name: string; avatar_url: string | null } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/messages')
  }, [user, authLoading, router])

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

    // If ?with= points to someone not in any conversation yet, fetch their profile too
    const allIds = withId && !convMap.has(withId) ? [...partnerIds, withId] : partnerIds

    if (allIds.length === 0) { setConversations([]); setLoadingConvs(false); return }

    const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', allIds)
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

    const convList: Conversation[] = partnerIds.map(pid => {
      const conv = convMap.get(pid)!
      const p = profileMap.get(pid)
      return { partner_id: pid, partner_name: p?.name ?? 'Unknown', partner_avatar: p?.avatar_url ?? null, last_message: conv.last_message, last_time: conv.last_time, unread: conv.unread }
    })

    setConversations(convList)

    // If ?with= is set and not yet active, open that conversation
    if (withId && !activePartner) {
      setActivePartner(withId)
      setMobileView('chat')
      const wp = profileMap.get(withId)
      if (wp) setActivePartnerProfile({ name: wp.name, avatar_url: wp.avatar_url })

      // Pre-fill input with product context
      if (productTitle && !input) {
        setInput(`Hi, I'm interested in your listing: ${decodeURIComponent(productTitle)}`)
      }
    } else if (!withId && !activePartner && convList.length > 0) {
      setActivePartner(convList[0].partner_id)
    }

    setLoadingConvs(false)
  }, [user, withId, productTitle, activePartner, input])

  useEffect(() => { loadConversations() }, [loadConversations])

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

        // Update or add conversation in the sidebar
        setConversations(prev => {
          const existing = prev.find(c => c.partner_id === activePartner)
          if (existing) return prev.map(c => c.partner_id === activePartner ? { ...c, last_message: content, last_time: data.created_at } : c)
          // New conversation — add it
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
  const activeInitials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

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
      <div style={{ background: '#111', color: '#fff', padding: '28px 20px' }}>
        <div className="container">
          <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px', letterSpacing: '-1px' }}>MESSAGES</div>
          <p style={{ color: '#666', marginTop: '4px', fontSize: '13px' }}>Real-time chat with buyers, sellers and service providers</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
        {loadingConvs ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', background: '#1B5E20', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
            <span style={{ color: '#888', fontWeight: 600 }}>Loading conversations...</span>
          </div>
        ) : conversations.length === 0 && !activePartner ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
            <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '24px', marginBottom: '12px' }}>No messages yet</div>
            <p style={{ color: '#888', maxWidth: '400px', margin: '0 auto 28px' }}>
              Start a conversation by clicking "Message Seller" on any listing page.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/goods" style={{ padding: '12px 28px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #888' }}>
                BROWSE GOODS
              </Link>
              <Link href="/services" style={{ padding: '12px 28px', background: '#1B5E20', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', textDecoration: 'none', border: '2px solid #1B5E20', boxShadow: '4px 4px 0 #888' }}>
                BROWSE SERVICES
              </Link>
            </div>
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '0', border: '2px solid #111', boxShadow: '6px 6px 0 #111', background: '#fff', minHeight: '600px' }}
            className="messages-grid"
          >
            {/* Sidebar */}
            <aside
              style={{ borderRight: '2px solid #111', overflowY: 'auto', maxHeight: '700px' }}
              className={`messages-sidebar${mobileView === 'chat' ? ' messages-sidebar-hidden' : ''}`}
            >
              <div style={{ padding: '14px 16px', borderBottom: '2px solid #111', background: '#f8f8f8' }}>
                <span style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', letterSpacing: '1px', color: '#888' }}>CONVERSATIONS</span>
              </div>

              {/* Current partner (if not in conversations yet) */}
              {activePartner && !conversations.find(c => c.partner_id === activePartner) && activePartnerProfile && (
                <button
                  onClick={() => { setActivePartner(activePartner); setMobileView('chat') }}
                  style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%', padding: '14px 16px',
                    background: '#e8f5e9', border: 'none', borderBottom: '1px solid #f0f0f0',
                    borderLeft: '3px solid #1B5E20', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                    {activePartnerProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111', marginBottom: '3px' }}>{activePartnerProfile.name}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>New conversation</div>
                  </div>
                </button>
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
                  {conv.partner_avatar ? (
                    <Image src={conv.partner_avatar} alt={conv.partner_name} width={42} height={42} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #eee' }} />
                  ) : (
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                      {conv.partner_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
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

            {/* Chat Panel */}
            <div
              style={{ display: 'flex', flexDirection: 'column' }}
              className={`messages-chat${mobileView === 'list' ? ' messages-chat-hidden' : ''}`}
            >
              {/* Chat Header */}
              <div style={{ padding: '14px 20px', borderBottom: '2px solid #111', background: '#f8f8f8', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setMobileView('list')}
                  className="messages-back-btn"
                  style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '18px', color: '#111', padding: '0 8px 0 0' }}
                >←</button>
                {activePartner && (
                  <>
                    {displayAvatar ? (
                      <Image src={displayAvatar} alt={displayName} width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #111' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                        {activeInitials}
                      </div>
                    )}
                    <div>
                      <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '16px' }}>{displayName}</div>
                      {productTitle && (
                        <div style={{ fontSize: '11px', color: '#888' }}>Re: {decodeURIComponent(productTitle)}</div>
                      )}
                    </div>
                  </>
                )}
                {!activePartner && (
                  <span style={{ color: '#888', fontSize: '14px' }}>Select a conversation</span>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', minHeight: '400px' }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>👋</div>
                    <div style={{ fontWeight: 600 }}>Say hello to get started!</div>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === user.id
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
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
                  disabled={!activePartner}
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
                  disabled={!input.trim() || sending || !activePartner}
                  style={{
                    padding: '12px 24px',
                    background: (!input.trim() || sending || !activePartner) ? '#888' : '#1B5E20',
                    color: '#fff', border: '2px solid #111',
                    fontFamily: '"Archivo Black", sans-serif', fontSize: '13px',
                    cursor: (!input.trim() || sending || !activePartner) ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.5px',
                  }}
                >
                  {sending ? '...' : 'SEND →'}
                </button>
              </div>
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
