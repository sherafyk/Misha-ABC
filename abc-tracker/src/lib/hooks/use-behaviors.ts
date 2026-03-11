'use client'

import { useCallback, useEffect, useState } from 'react'

import { adminMutate } from '@/lib/admin-client'
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

    try {
      const data = await adminMutate<BehaviorDefinition>('create_behavior', input as Record<string, unknown>)
      setLoading(false)
      return { data, error: null }
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Unable to create behavior'
      setError(message)
      setLoading(false)
      return { data: null, error: new Error(message) }
    }
  }, [])

  return { createBehavior, loading, error }
}

export function useUpdateBehavior() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateBehavior = useCallback(async (id: string, input: UpdateBehaviorInput) => {
    setLoading(true)
    setError(null)

    try {
      const data = await adminMutate<BehaviorDefinition>('update_behavior', { id, updates: input as Record<string, unknown> })
      setLoading(false)
      return { data, error: null }
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update behavior'
      setError(message)
      setLoading(false)
      return { data: null, error: new Error(message) }
    }
  }, [])

  return { updateBehavior, loading, error }
}

export function useDeleteBehavior() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteBehavior = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      await adminMutate<{ id: string }>('archive_behavior', { id })
      setLoading(false)
      return { error: null }
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unable to archive behavior'
      setError(message)
      setLoading(false)
      return { error: new Error(message) }
    }
  }, [])

  return { deleteBehavior, loading, error }
}
