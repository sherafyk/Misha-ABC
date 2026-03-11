'use client'

import { useCallback, useEffect, useState } from 'react'

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

    const supabase = createClient()
    const { data, error: createError } = await supabase
      .from('antecedent_options')
      .insert({ ...input, is_custom: true })
      .select('*')
      .single()

    if (createError) {
      setError(createError.message)
      setLoading(false)
      return { data: null, error: createError }
    }

    setLoading(false)
    return { data: data as AntecedentOption, error: null }
  }, [])

  return { createAntecedent, loading, error }
}
