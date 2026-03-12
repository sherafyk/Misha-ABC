import { NextResponse, type NextRequest } from 'next/server'

import { APP_SESSION_COOKIE } from '@/lib/session-constants'

const PUBLIC_PATHS = new Set(['/login'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api/auth') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  const hasSession = Boolean(request.cookies.get(APP_SESSION_COOKIE)?.value)

  if (!hasSession && !PUBLIC_PATHS.has(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
}
