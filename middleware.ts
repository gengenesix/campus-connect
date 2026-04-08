import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/sell', '/offer-service', '/messages', '/profile', '/my-listings', '/admin']
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

  // Redirect unauthenticated users away from protected pages
  if (!user && PROTECTED_PATHS.some(p => path.startsWith(p))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirect', path)
    const redirect = NextResponse.redirect(redirectUrl)
    // CRITICAL: copy refreshed session cookies to the redirect response,
    // otherwise the browser never receives the updated token and the user
    // gets logged out on every subsequent page load
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirect.cookies.set(cookie.name, cookie.value, cookie)
    )
    return redirect
  }

  // Redirect authenticated users away from auth pages
  if (user && AUTH_PATHS.some(p => path.startsWith(p))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    const redirect = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirect.cookies.set(cookie.name, cookie.value, cookie)
    )
    return redirect
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
