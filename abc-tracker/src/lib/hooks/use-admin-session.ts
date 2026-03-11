'use client'

import { useCallback, useEffect, useState } from 'react'

export function useAdminSession() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const response = await fetch('/api/admin/session', { cache: 'no-store', credentials: 'include' })
    const body = (await response.json()) as { isAdmin: boolean; configured: boolean }
    setIsAdmin(body.isAdmin)
    setConfigured(body.configured)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh()
    }, 0)

    return () => clearTimeout(timer)
  }, [refresh])

  const login = useCallback(
    async (password: string) => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })

      const body = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to login')
      }

      await refresh()
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    await refresh()
  }, [refresh])

  return { isAdmin, configured, loading, login, logout, refresh }
}
