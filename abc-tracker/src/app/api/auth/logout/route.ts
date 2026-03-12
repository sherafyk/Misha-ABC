import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { APP_SESSION_COOKIE } from '@/lib/session-constants'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value

  if (token) {
    const supabase = createAdminClient()
    await supabase.rpc('revoke_screen_session', { session_token: token })
  }

  cookieStore.delete(APP_SESSION_COOKIE)
  return NextResponse.json({ success: true })
}
