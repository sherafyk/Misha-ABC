'use client'

import { useCallback, useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { DailyLog } from '@/lib/types/database'

type DailyLogInput = Omit<DailyLog, 'id' | 'created_at' | 'updated_at'>

export function useDailyLogs(dateRange?: { startDate?: string; endDate?: string }) {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDailyLogs = useCallback(async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    let query = supabase.from('daily_logs').select('*').order('log_date', { ascending: false })

    if (dateRange?.startDate) query = query.gte('log_date', dateRange.startDate)
    if (dateRange?.endDate) query = query.lte('log_date', dateRange.endDate)

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setDailyLogs((data as DailyLog[] | null) ?? [])
    setLoading(false)
  }, [dateRange])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDailyLogs()
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchDailyLogs])

  return {
    dailyLogs,
    loading,
    error,
    empty: !loading && !error && dailyLogs.length === 0,
    refetch: fetchDailyLogs,
    setDailyLogs,
  }
}

export function useCreateDailyLog() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDailyLog = useCallback(async (input: DailyLogInput) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: createError } = await supabase
      .from('daily_logs')
      .insert(input)
      .select('*')
      .single()

    if (createError) {
      setError(createError.message)
      setLoading(false)
      return { data: null, error: createError }
    }

    setLoading(false)
    return { data: data as DailyLog, error: null }
  }, [])

  return { createDailyLog, loading, error }
}

export function useUpdateDailyLog() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateDailyLog = useCallback(async (id: string, input: Partial<DailyLogInput>) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: updateError } = await supabase
      .from('daily_logs')
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
    return { data: data as DailyLog, error: null }
  }, [])

  return { updateDailyLog, loading, error }
}
