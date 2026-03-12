import { createClient } from '@/lib/supabase/server'

export type AppRole = 'admin' | 'caretaker'

export interface AppSession {
  appUserId: string
  screenName: string
  role: AppRole
  authUserId: string
  email: string | null
}

interface AppUserRow {
  id: string
  screen_name: string
  role: AppRole
}

export async function getAppSession(): Promise<AppSession | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: appUser, error: appUserError } = await supabase
    .from('app_users')
    .select('id, screen_name, role')
    .eq('auth_user_id', user.id)
    .maybeSingle<AppUserRow>()

  // Fall back to auth metadata if the app_users lookup is temporarily unavailable
  // (e.g., before latest RLS migration is applied).
  if (appUserError) {
    return {
      appUserId: user.id,
      screenName: user.user_metadata?.screen_name ?? user.email ?? 'User',
      role: user.app_metadata?.app_role === 'admin' ? 'admin' : 'caretaker',
      authUserId: user.id,
      email: user.email ?? null,
    }
  }

  const metadataRole = user.app_metadata?.app_role
  const role: AppRole = metadataRole === 'admin' ? 'admin' : 'caretaker'

  return {
    appUserId: appUser?.id ?? user.id,
    screenName: appUser?.screen_name ?? user.user_metadata?.screen_name ?? user.email ?? 'User',
    role: appUser?.role ?? role,
    authUserId: user.id,
    email: user.email ?? null,
  }
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

  const adminOnly = new Set(['upsert_child_profile', 'create_behavior', 'update_behavior', 'archive_behavior'])

  if (role === 'admin') return caretakerAllowed.has(operation) || adminOnly.has(operation)
  return caretakerAllowed.has(operation)
}
