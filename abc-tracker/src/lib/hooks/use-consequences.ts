'use client'

import { useCallback, useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { ConsequenceOption, ConsequenceType } from '@/lib/types/database'

type ConsequenceInput = Pick<ConsequenceOption, 'label'> & { type: ConsequenceType }

export function useConsequences() {
  const [consequences, setConsequences] = useState<ConsequenceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConsequences = useCallback(async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('consequence_options')
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

    setConsequences((data as ConsequenceOption[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchConsequences()
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchConsequences])

  return {
    consequences,
    loading,
    error,
    empty: !loading && !error && consequences.length === 0,
    refetch: fetchConsequences,
  }
}

export function useCreateConsequence() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createConsequence = useCallback(async (input: ConsequenceInput) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: createError } = await supabase
      .from('consequence_options')
      .insert({ ...input, is_custom: true })
      .select('*')
      .single()

    if (createError) {
      setError(createError.message)
      setLoading(false)
      return { data: null, error: createError }
    }

    setLoading(false)
    return { data: data as ConsequenceOption, error: null }
  }, [])

  return { createConsequence, loading, error }
}
