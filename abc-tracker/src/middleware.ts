import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = new Set(['/login'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api/auth') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }


  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname !== '/login') {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !PUBLIC_PATHS.has(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
}
