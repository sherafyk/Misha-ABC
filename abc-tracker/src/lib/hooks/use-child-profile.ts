'use client'

import { useCallback, useEffect, useState } from 'react'

import { adminMutate } from '@/lib/admin-client'
import { createClient } from '@/lib/supabase/client'
import type { ChildProfile } from '@/lib/types/database'

type UpsertChildProfileInput = Omit<ChildProfile, 'id' | 'created_at' | 'updated_at'> &
  Partial<Pick<ChildProfile, 'id'>>

export function useChildProfile() {
  const [profile, setProfile] = useState<ChildProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('child_profile')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setProfile((data as ChildProfile | null) ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchProfile()
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    empty: !loading && !error && !profile,
    refetch: fetchProfile,
  }
}

export function useUpdateChildProfile() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProfile = useCallback(async (input: UpsertChildProfileInput) => {
    setLoading(true)
    setError(null)

    try {
      const data = await adminMutate<ChildProfile>('upsert_child_profile', {
        ...input,
        updated_at: new Date().toISOString(),
      })
      setLoading(false)
      return { data, error: null }
    } catch (upsertError) {
      const message = upsertError instanceof Error ? upsertError.message : 'Unable to update profile'
      setError(message)
      setLoading(false)
      return { data: null, error: new Error(message) }
    }
  }, [])

  return {
    updateProfile,
    loading,
    error,
  }
}
