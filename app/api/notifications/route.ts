import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status })
}

// GET /api/notifications — fetch the current user's notifications (newest first)
export async function GET(req: NextRequest) {
  try {
    let supabase
    try {
      supabase = await createSupabaseServerClient()
    } catch (e: any) {
      console.error('[API /notifications GET] Supabase client error:', e?.message)
      return err('Service unavailable', 503)
    }

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return err('Unauthorized', 401)

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

    let query = supabase
      .from('notifications')
      .select('id, type, title, body, data, read, created_at')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) query = query.eq('read', false)

    const { data, error } = await query

    if (error) {
      console.error('[API /notifications GET] Query error:', error.message)
      return err('Failed to load notifications', 500)
    }

    // Also return unread count
    const { data: countData } = await supabase.rpc('get_unread_count')

    return NextResponse.json({
      notifications: data ?? [],
      unreadCount: countData ?? 0,
    })
  } catch (e: any) {
    console.error('[API /notifications GET] Unhandled exception:', e?.message ?? e)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

// PATCH /api/notifications — mark notifications as read
// Body: { ids: string[] }  — specific IDs, or omit to mark all as read
export async function PATCH(req: NextRequest) {
  try {
    let supabase
    try {
      supabase = await createSupabaseServerClient()
    } catch (e: any) {
      console.error('[API /notifications PATCH] Supabase client error:', e?.message)
      return err('Service unavailable', 503)
    }

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return err('Unauthorized', 401)

    let body: { ids?: string[] } = {}
    try {
      body = await req.json()
    } catch {
      // Empty body = mark all as read
    }

    let query = supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', authData.user.id)

    if (body.ids && body.ids.length > 0) {
      query = query.in('id', body.ids)
    }

    const { error } = await query

    if (error) {
      console.error('[API /notifications PATCH] Update error:', error.message)
      return err('Failed to update notifications', 500)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[API /notifications PATCH] Unhandled exception:', e?.message ?? e)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
