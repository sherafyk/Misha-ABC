'use client'

import { useAuthSession } from '@/lib/hooks/use-auth-session'

export function useAdminSession() {
  const session = useAuthSession()

  const login = async () => {
    throw new Error('Admin password login has been replaced by user login at /login.')
  }

  return {
    isAdmin: session.isAdmin,
    configured: true,
    loading: session.loading,
    login,
    logout: session.logout,
    refresh: session.refresh,
    role: session.role,
    authenticated: session.authenticated,
  }
}
