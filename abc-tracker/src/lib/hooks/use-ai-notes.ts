'use client'

import { useCallback, useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { AINote } from '@/lib/types/database'

interface AINoteFilters {
  incidentId?: string
  dailyLogId?: string
  noteType?: AINote['note_type']
}

export function useAINotes(filters?: AINoteFilters) {
  const [notes, setNotes] = useState<AINote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    let query = supabase.from('ai_notes').select('*').order('created_at', { ascending: false })

    if (filters?.incidentId) query = query.eq('incident_id', filters.incidentId)
    if (filters?.dailyLogId) query = query.eq('daily_log_id', filters.dailyLogId)
    if (filters?.noteType) query = query.eq('note_type', filters.noteType)

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setNotes((data as AINote[] | null) ?? [])
    setLoading(false)
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNotes()
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchNotes])

  return {
    notes,
    loading,
    error,
    empty: !loading && !error && notes.length === 0,
    refetch: fetchNotes,
    setNotes,
  }
}
