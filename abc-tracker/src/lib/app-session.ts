import { cookies } from 'next/headers'

import { APP_SESSION_COOKIE } from '@/lib/session-constants'
import { createAdminClient } from '@/lib/supabase/admin'

export type AppRole = 'admin' | 'caretaker'

export interface AppSession {
  appUserId: string
  screenName: string
  role: AppRole
  expiresAt: string
  token: string
}

interface RawSessionRow {
  app_user_id: string
  screen_name: string
  app_role: AppRole
  expires_at: string
}

function mapRow(row: RawSessionRow, token: string): AppSession {
  return {
    appUserId: row.app_user_id,
    screenName: row.screen_name,
    role: row.app_role,
    expiresAt: row.expires_at,
    token,
  }
}

export async function resolveAppSessionFromToken(token?: string | null): Promise<AppSession | null> {
  if (!token) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('resolve_screen_session', { session_token: token })

  if (error || !Array.isArray(data) || data.length === 0) {
    return null
  }

  return mapRow(data[0] as RawSessionRow, token)
}

export async function getAppSession(): Promise<AppSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value
  return resolveAppSessionFromToken(token)
}

export async function requireAppSession() {
  const session = await getAppSession()
  if (!session) {
    throw new Error('Authentication required.')
  }
  return session
}

export function canMutateOperation(role: AppRole, operation: string) {
  const caretakerAllowed = new Set([
    'create_incident',
    'update_incident',
    'delete_incident',
    'create_daily_log',
    'update_daily_log',
    'upsert_daily_log',
    'create_antecedent',
    'create_consequence',
  ])

  const adminOnly = new Set([
    'upsert_child_profile',
    'create_behavior',
    'update_behavior',
    'archive_behavior',
  ])

  if (role === 'admin') return caretakerAllowed.has(operation) || adminOnly.has(operation)
  return caretakerAllowed.has(operation)
}
