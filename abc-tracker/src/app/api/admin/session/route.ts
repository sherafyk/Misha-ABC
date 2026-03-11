import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getAdminSessionCookieName, isAdminAuthConfigured, isValidAdminSessionToken } from '@/lib/admin-auth'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(getAdminSessionCookieName())?.value

  return NextResponse.json({
    isAdmin: isValidAdminSessionToken(token),
    configured: isAdminAuthConfigured(),
  })
}
