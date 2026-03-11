'use client'

import { useCallback, useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { BehaviorDefinition } from '@/lib/types/database'

type CreateBehaviorInput = Omit<BehaviorDefinition, 'id' | 'created_at'>
type UpdateBehaviorInput = Partial<CreateBehaviorInput>

export function useBehaviors() {
  const [behaviors, setBehaviors] = useState<BehaviorDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBehaviors = useCallback(async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('behavior_definitions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setBehaviors((data as BehaviorDefinition[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchBehaviors()
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchBehaviors])

  return {
    behaviors,
    loading,
    error,
    empty: !loading && !error && behaviors.length === 0,
    refetch: fetchBehaviors,
    setBehaviors,
  }
}

export function useCreateBehavior() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createBehavior = useCallback(async (input: CreateBehaviorInput) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: createError } = await supabase
      .from('behavior_definitions')
      .insert(input)
      .select('*')
      .single()

    if (createError) {
      setError(createError.message)
      setLoading(false)
      return { data: null, error: createError }
    }

    setLoading(false)
    return { data: data as BehaviorDefinition, error: null }
  }, [])

  return { createBehavior, loading, error }
}

export function useUpdateBehavior() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateBehavior = useCallback(async (id: string, input: UpdateBehaviorInput) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: updateError } = await supabase
      .from('behavior_definitions')
      .update(input)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return { data: null, error: updateError }
    }

    setLoading(false)
    return { data: data as BehaviorDefinition, error: null }
  }, [])

  return { updateBehavior, loading, error }
}

export function useDeleteBehavior() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteBehavior = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('behavior_definitions')
      .update({ is_active: false })
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      setLoading(false)
      return { error: deleteError }
    }

    setLoading(false)
    return { error: null }
  }, [])

  return { deleteBehavior, loading, error }
}
