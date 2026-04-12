import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// /profile (edit own profile) is protected, but /profile/[id] (view others) is public
const PROTECTED_PATHS = ['/dashboard', '/sell', '/offer-service', '/messages', '/my-listings', '/admin']
const AUTH_PATHS = ['/auth/login', '/auth/register']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Use getUser() not getSession() — it validates the JWT server-side
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const copySessionCookies = (to: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach(c => to.cookies.set(c.name, c.value, c))
  }

  // Helper: fetch role from DB (only called when actually needed)
  const getRole = async (): Promise<string | null> => {
    if (!user) return null
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    return data?.role ?? null
  }

  // ── /admin: server-side gate ───────────────────────────────────────────────
  // Not logged in → redirect to login
  if (!user && path.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', path)
    const r = NextResponse.redirect(url)
    copySessionCookies(r)
    return r
  }
  // Logged in but not admin → 404 (hides that /admin even exists)
  // gengenesix@gmail.com is hardcoded as admin regardless of DB role
  if (user && path.startsWith('/admin')) {
    const isAdmin = user.email === 'gengenesix@gmail.com' || (await getRole()) === 'admin'
    if (!isAdmin) {
      return NextResponse.rewrite(new URL('/not-found', request.url))
    }
  }

  // ── Other protected pages ─────────────────────────────────────────────────
  // /profile (exact) is protected; /profile/[id] is public
  const nonAdminProtected = PROTECTED_PATHS.filter(p => p !== '/admin')
  const isProtected = nonAdminProtected.some(p => path.startsWith(p)) || path === '/profile'
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', path)
    const r = NextResponse.redirect(url)
    copySessionCookies(r)
    return r
  }

  // ── Auth pages: redirect already-logged-in users ──────────────────────────
  if (user && AUTH_PATHS.some(p => path.startsWith(p))) {
    const isAdmin = user.email === 'gengenesix@gmail.com' || (await getRole()) === 'admin'
    const url = request.nextUrl.clone()
    url.pathname = isAdmin ? '/admin' : '/dashboard'
    const r = NextResponse.redirect(url)
    copySessionCookies(r)
    return r
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
