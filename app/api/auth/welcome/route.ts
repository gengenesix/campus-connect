import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { inngest } from '@/lib/inngest'

// POST /api/auth/welcome — emit user/registered Inngest event after signup
// Called from the register page after a successful supabase.auth.signUp()
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const name: string = body.name ?? user.user_metadata?.name ?? 'Student'

    void inngest.send({
      name: 'user/registered',
      data: { userId: user.id, email: user.email ?? '', name },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[/api/auth/welcome]', e?.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
