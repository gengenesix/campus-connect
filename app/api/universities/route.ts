import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/universities — list all active universities
// Public endpoint — no auth required.
// Returns slug, name, short_name, region, city, type for the university picker.
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')   // optional: 'public' | 'private' | 'technical'
    const region = searchParams.get('region') // optional: e.g. 'Greater Accra'

    let query = supabase
      .from('universities')
      .select('id, slug, name, short_name, region, city, type, logo_url, primary_color')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (type) query = query.eq('type', type)
    if (region) query = query.eq('region', region)

    const { data, error } = await query

    if (error) {
      console.error('[API /universities] Query error:', error.message)
      return NextResponse.json({ error: 'Failed to load universities' }, { status: 500 })
    }

    return NextResponse.json(
      { universities: data ?? [] },
      {
        headers: {
          // Cache for 1 hour at edge — university list rarely changes
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (e: any) {
    console.error('[API /universities] Unhandled exception:', e?.message ?? e)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
