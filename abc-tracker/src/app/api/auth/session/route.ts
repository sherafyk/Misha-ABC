import { NextResponse } from 'next/server'

import { getAppSession } from '@/lib/app-session'

export async function GET() {
  const session = await getAppSession()

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    role: session.role,
    screenName: session.screenName,
    appUserId: session.appUserId,
  })
}
