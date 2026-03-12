import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { APP_SESSION_COOKIE } from '@/lib/session-constants'
import { createAdminClient } from '@/lib/supabase/admin'

interface AuthRow {
  session_token: string
  session_expires_at: string
  app_user_id: string
  app_role: 'admin' | 'caretaker'
}

export async function POST(request: Request) {
  const body = (await request.json()) as { screenName?: string; pin?: string }
  const screenName = body.screenName?.trim()
  const pin = body.pin?.trim()

  if (!screenName) {
    return NextResponse.json({ error: 'Screen name is required.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('authenticate_screen_name', {
    login_screen_name: screenName,
    login_pin: pin || null,
  })

  if (error || !Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ error: error?.message ?? 'Invalid login credentials.' }, { status: 401 })
  }

  const session = data[0] as AuthRow
  const cookieStore = await cookies()
  cookieStore.set(APP_SESSION_COOKIE, session.session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(session.session_expires_at),
  })

  return NextResponse.json({ role: session.app_role, appUserId: session.app_user_id })
}
