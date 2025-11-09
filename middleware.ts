import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public file patterns and routes that should bypass middleware
  const publicPatterns = [
    '/_next/',           // Next.js assets
    '/api/webhooks/',    // Webhook endpoints
    '/favicon.ico',      // Favicon
    '/manifest.json',    // PWA manifest
    '/icon-',            // Icon files (icon-144x144.png, etc.)
    '/sw.js',            // Service worker
    '/robots.txt',       // Robots file
    '/sitemap.xml',      // Sitemap
  ]

  // Public routes that don't require auth
  const publicRoutes = [
    '/login',
    '/auth/callback',
    '/auth/confirm',
    '/signup',
    '/reset-password',
    '/offline',
  ]

  // Check if path matches public patterns
  if (publicPatterns.some(pattern => pathname.startsWith(pattern))) {
    return NextResponse.next()
  }

  // Check if path is a public route
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Static file extensions that should bypass auth
  const PUBLIC_FILE = /\.(.*)$/
  if (PUBLIC_FILE.test(pathname) && !pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie in both request and response
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from both request and response
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // This will automatically refresh expired sessions
  const { data: { session }, error } = await supabase.auth.getSession()

  // If no session and trying to access protected route, redirect to login
  if (!session && !publicRoutes.includes(pathname) && pathname !== '/login') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If session exists and user is trying to access login page, redirect to home
  if (session && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
