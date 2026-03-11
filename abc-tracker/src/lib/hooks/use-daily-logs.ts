'use client'

import { useCallback, useEffect, useState } from 'react'

import { adminMutate } from '@/lib/admin-client'
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

  const upsertDailyLog = useCallback(async (input: DailyLogInput) => {
    setLoading(true)
    setError(null)

    let data: DailyLog
    try {
      data = await adminMutate<DailyLog>('upsert_daily_log', input as Record<string, unknown>)
    } catch (upsertError) {
      const message = upsertError instanceof Error ? upsertError.message : 'Unable to save daily log'
      setError(message)
      setLoading(false)
      return { data: null, error: new Error(message) }
    }

    setDailyLogs((current) => {
      const next = [...current]
      const index = next.findIndex((item) => item.log_date === input.log_date)
      if (index === -1) {
        next.unshift(data as DailyLog)
      } else {
        next[index] = data as DailyLog
      }
      return next.sort((a, b) => (a.log_date < b.log_date ? 1 : -1))
    })

    setLoading(false)
    return { data: data as DailyLog, error: null }
  }, [])

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
    upsertDailyLog,
    setDailyLogs,
  }
}

export function useCreateDailyLog() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDailyLog = useCallback(async (input: DailyLogInput) => {
    setLoading(true)
    setError(null)

    try {
      const data = await adminMutate<DailyLog>('create_daily_log', input as Record<string, unknown>)
      setLoading(false)
      return { data, error: null }
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Unable to create daily log'
      setError(message)
      setLoading(false)
      return { data: null, error: new Error(message) }
    }
  }, [])

  return { createDailyLog, loading, error }
}

export function useUpdateDailyLog() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateDailyLog = useCallback(async (id: string, input: Partial<DailyLogInput>) => {
    setLoading(true)
    setError(null)

    try {
      const data = await adminMutate<DailyLog>('update_daily_log', { id, updates: input as Record<string, unknown> })
      setLoading(false)
      return { data, error: null }
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update daily log'
      setError(message)
      setLoading(false)
      return { data: null, error: new Error(message) }
    }
  }, [])

  return { updateDailyLog, loading, error }
}
