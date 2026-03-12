'use client'

import { useCallback, useEffect, useState } from 'react'

import { parseJsonResponse } from '@/lib/http'
import type { AppRole } from '@/lib/app-session'

interface SessionResponse {
  authenticated?: boolean
  role?: AppRole
  screenName?: string
}

export function useAuthSession() {
  const [authenticated, setAuthenticated] = useState(false)
  const [role, setRole] = useState<AppRole | null>(null)
  const [screenName, setScreenName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const response = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' })
    const body = await parseJsonResponse<SessionResponse>(response)

    if (!response.ok || !body?.authenticated) {
      setAuthenticated(false)
      setRole(null)
      setScreenName(null)
      setLoading(false)
      return
    }

    setAuthenticated(true)
    setRole(body.role ?? null)
    setScreenName(body.screenName ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh()
    }, 0)

    return () => clearTimeout(timer)
  }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    await refresh()
  }, [refresh])

  return {
    authenticated,
    role,
    screenName,
    isAdmin: role === 'admin',
    loading,
    refresh,
    logout,
  }
}
