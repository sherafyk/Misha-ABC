import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
  createAdminSessionToken,
  getAdminSessionCookieName,
  isAdminAuthConfigured,
  validateAdminPassword,
} from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 500 })
  }

  const body = (await request.json()) as { password?: string }

  if (!validateAdminPassword(body.password ?? '')) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(getAdminSessionCookieName(), createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return NextResponse.json({ success: true })
}
