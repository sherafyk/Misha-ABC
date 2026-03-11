import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getAdminSessionCookieName } from '@/lib/admin-auth'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(getAdminSessionCookieName())
  return NextResponse.json({ success: true })
}
