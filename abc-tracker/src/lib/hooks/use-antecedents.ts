'use client'

import { useCallback, useEffect, useState } from 'react'

import { adminMutate } from '@/lib/admin-client'
import { createClient } from '@/lib/supabase/client'
import type { AntecedentOption } from '@/lib/types/database'

type AntecedentInput = Pick<AntecedentOption, 'label' | 'category'>

export function useAntecedents() {
  const [antecedents, setAntecedents] = useState<AntecedentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAntecedents = useCallback(async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('antecedent_options')
      .select('*')
      .eq('is_active', true)
      .order('is_custom', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setAntecedents((data as AntecedentOption[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAntecedents()
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchAntecedents])

  return {
    antecedents,
    loading,
    error,
    empty: !loading && !error && antecedents.length === 0,
    refetch: fetchAntecedents,
  }
}

export function useCreateAntecedent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAntecedent = useCallback(async (input: AntecedentInput) => {
    setLoading(true)
    setError(null)

    try {
      const data = await adminMutate<AntecedentOption>('create_antecedent', input as Record<string, unknown>)
      setLoading(false)
      return { data, error: null }
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Unable to create antecedent'
      setError(message)
      setLoading(false)
      return { data: null, error: new Error(message) }
    }
  }, [])

  return { createAntecedent, loading, error }
}
