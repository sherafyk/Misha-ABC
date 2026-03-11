'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type {
  BehaviorFunction,
  BehaviorSeverity,
  Incident,
  IncidentSetting,
} from '@/lib/types/database'

export interface IncidentFilters {
  startDate?: string
  endDate?: string
  behaviorIds?: string[]
  settings?: IncidentSetting[]
  functions?: BehaviorFunction[]
  severities?: BehaviorSeverity[]
}

export interface IncidentStats {
  total: number
  bySeverity: Record<BehaviorSeverity, number>
  byFunction: Record<BehaviorFunction, number>
}

type IncidentInput = Omit<Incident, 'id' | 'created_at' | 'updated_at' | 'behavior' | 'antecedents' | 'consequences'>

type JoinedIncidentRow = Omit<Incident, 'antecedents' | 'consequences'> & {
  incident_antecedents?: { antecedent_options: Incident['antecedents'] extends (infer T)[] ? T : never }[]
  incident_consequences?: { consequence_options: Incident['consequences'] extends (infer T)[] ? T : never }[]
}

function mapJoinedIncident(row: JoinedIncidentRow): Incident {
  return {
    ...row,
    antecedents: row.incident_antecedents?.map((item) => item.antecedent_options) ?? [],
    consequences: row.incident_consequences?.map((item) => item.consequence_options) ?? [],
    antecedent_ids: row.antecedent_ids ?? [],
    consequence_ids: row.consequence_ids ?? [],
  }
}

export function useIncidents(filters?: IncidentFilters) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    let query = supabase
      .from('incidents')
      .select(
        '*, behavior:behavior_definitions(*), incident_antecedents(antecedent_options(*)), incident_consequences(consequence_options(*))',
      )
      .order('occurred_at', { ascending: false })

    if (filters?.startDate) query = query.gte('occurred_at', filters.startDate)
    if (filters?.endDate) query = query.lte('occurred_at', filters.endDate)
    if (filters?.behaviorIds?.length) query = query.in('behavior_id', filters.behaviorIds)
    if (filters?.settings?.length) query = query.in('setting', filters.settings)
    if (filters?.functions?.length) query = query.in('hypothesized_function', filters.functions)
    if (filters?.severities?.length) query = query.in('severity', filters.severities)

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const mapped = ((data as JoinedIncidentRow[] | null) ?? []).map(mapJoinedIncident)
    setIncidents(mapped)
    setLoading(false)
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchIncidents()
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchIncidents])

  return {
    incidents,
    loading,
    error,
    empty: !loading && !error && incidents.length === 0,
    refetch: fetchIncidents,
    setIncidents,
  }
}

export function useIncident(id?: string) {
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  const fetchIncident = useCallback(async () => {
    if (!id) {
      setIncident(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('incidents')
      .select(
        '*, behavior:behavior_definitions(*), incident_antecedents(antecedent_options(*)), incident_consequences(consequence_options(*))',
      )
      .eq('id', id)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setIncident(mapJoinedIncident(data as JoinedIncidentRow))
    setLoading(false)
  }, [id])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchIncident()
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchIncident])

  return {
    incident,
    loading,
    error,
    empty: !loading && !error && !incident,
    refetch: fetchIncident,
  }
}

export function useCreateIncident() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createIncident = useCallback(async (input: IncidentInput) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { antecedent_ids, consequence_ids, ...incidentPayload } = input
    const { data, error: createError } = await supabase
      .from('incidents')
      .insert(incidentPayload)
      .select('*')
      .single()

    if (createError || !data) {
      setError(createError?.message ?? 'Unable to create incident')
      setLoading(false)
      return { data: null, error: createError }
    }

    const incidentId = (data as Incident).id
    if (antecedent_ids.length) {
      const { error: antecedentError } = await supabase.from('incident_antecedents').insert(
        antecedent_ids.map((antecedentId) => ({
          incident_id: incidentId,
          antecedent_id: antecedentId,
        })),
      )
      if (antecedentError) {
        setError(antecedentError.message)
        setLoading(false)
        return { data: null, error: antecedentError }
      }
    }

    if (consequence_ids.length) {
      const { error: consequenceError } = await supabase.from('incident_consequences').insert(
        consequence_ids.map((consequenceId) => ({
          incident_id: incidentId,
          consequence_id: consequenceId,
        })),
      )
      if (consequenceError) {
        setError(consequenceError.message)
        setLoading(false)
        return { data: null, error: consequenceError }
      }
    }

    setLoading(false)
    return { data: data as Incident, error: null }
  }, [])

  return { createIncident, loading, error }
}

export function useUpdateIncident() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateIncident = useCallback(async (id: string, input: Partial<IncidentInput>) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { antecedent_ids, consequence_ids, ...incidentPayload } = input

    if (Object.keys(incidentPayload).length > 0) {
      const { error: updateError } = await supabase.from('incidents').update(incidentPayload).eq('id', id)
      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return { error: updateError }
      }
    }

    if (antecedent_ids) {
      await supabase.from('incident_antecedents').delete().eq('incident_id', id)
      if (antecedent_ids.length) {
        const { error: antecedentError } = await supabase.from('incident_antecedents').insert(
          antecedent_ids.map((antecedentId) => ({ incident_id: id, antecedent_id: antecedentId })),
        )
        if (antecedentError) {
          setError(antecedentError.message)
          setLoading(false)
          return { error: antecedentError }
        }
      }
    }

    if (consequence_ids) {
      await supabase.from('incident_consequences').delete().eq('incident_id', id)
      if (consequence_ids.length) {
        const { error: consequenceError } = await supabase.from('incident_consequences').insert(
          consequence_ids.map((consequenceId) => ({ incident_id: id, consequence_id: consequenceId })),
        )
        if (consequenceError) {
          setError(consequenceError.message)
          setLoading(false)
          return { error: consequenceError }
        }
      }
    }

    setLoading(false)
    return { error: null }
  }, [])

  return { updateIncident, loading, error }
}

export function useDeleteIncident() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteIncident = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: deleteError } = await supabase.from('incidents').delete().eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      setLoading(false)
      return { error: deleteError }
    }

    setLoading(false)
    return { error: null }
  }, [])

  return { deleteIncident, loading, error }
}

export function useIncidentStats(dateRange?: { startDate?: string; endDate?: string }) {
  const { incidents, loading, error } = useIncidents({
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
  })

  const stats = useMemo<IncidentStats>(() => {
    const base: IncidentStats = {
      total: incidents.length,
      bySeverity: { low: 0, medium: 0, high: 0, crisis: 0 },
      byFunction: { sensory: 0, escape: 0, attention: 0, tangible: 0, unknown: 0 },
    }

    incidents.forEach((incident) => {
      base.bySeverity[incident.severity] += 1
      base.byFunction[incident.hypothesized_function] += 1
    })

    return base
  }, [incidents])

  return {
    stats,
    incidents,
    loading,
    error,
    empty: !loading && !error && incidents.length === 0,
  }
}
