'use client'

import { useMemo, useState } from 'react'
import { endOfMonth, endOfWeek, formatISO, startOfMonth, startOfToday, startOfWeek, subDays } from 'date-fns'
import { Search, X } from 'lucide-react'

import { IncidentCard } from '@/components/cards/incident-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SETTINGS } from '@/lib/constants/abc-options'
import { useBehaviors } from '@/lib/hooks/use-behaviors'
import { useIncidents } from '@/lib/hooks/use-incidents'
import type { BehaviorFunction, BehaviorSeverity, Incident } from '@/lib/types/database'

type DatePreset = 'today' | 'week' | 'month' | 'custom'

const behaviorFunctions: BehaviorFunction[] = ['sensory', 'escape', 'attention', 'tangible', 'unknown']
const severityOptions: BehaviorSeverity[] = ['low', 'medium', 'high', 'crisis']

function withinDatePreset(incident: Incident, preset: DatePreset, customStart: string, customEnd: string) {
  const occurred = new Date(incident.occurred_at)

  if (preset === 'today') {
    return occurred >= startOfToday()
  }

  if (preset === 'week') {
    return occurred >= startOfWeek(new Date(), { weekStartsOn: 0 }) && occurred <= endOfWeek(new Date(), { weekStartsOn: 0 })
  }

  if (preset === 'month') {
    return occurred >= startOfMonth(new Date()) && occurred <= endOfMonth(new Date())
  }

  if (customStart && occurred < new Date(customStart)) return false
  if (customEnd && occurred > new Date(customEnd)) return false
  return true
}

export default function IncidentsPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>('week')
  const [search, setSearch] = useState('')
  const [behaviorId, setBehaviorId] = useState('all')
  const [setting, setSetting] = useState<'all' | Incident['setting']>('all')
  const [incidentFunction, setIncidentFunction] = useState<'all' | BehaviorFunction>('all')
  const [severity, setSeverity] = useState<'all' | BehaviorSeverity>('all')
  const [customStartDate, setCustomStartDate] = useState(formatISO(subDays(new Date(), 30), { representation: 'date' }))
  const [customEndDate, setCustomEndDate] = useState(formatISO(new Date(), { representation: 'date' }))
  const [visibleCount, setVisibleCount] = useState(20)

  const { incidents, loading, error } = useIncidents()
  const { behaviors } = useBehaviors()

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (!withinDatePreset(incident, datePreset, customStartDate, customEndDate)) return false
      if (behaviorId !== 'all' && incident.behavior_id !== behaviorId) return false
      if (setting !== 'all' && incident.setting !== setting) return false
      if (incidentFunction !== 'all' && incident.hypothesized_function !== incidentFunction) return false
      if (severity !== 'all' && incident.severity !== severity) return false

      if (search.trim()) {
        const haystack = `${incident.parent_raw_notes ?? ''} ${incident.behavior_notes ?? ''}`.toLowerCase()
        if (!haystack.includes(search.toLowerCase())) return false
      }

      return true
    })
  }, [incidents, datePreset, customStartDate, customEndDate, behaviorId, setting, incidentFunction, severity, search])

  const activeFilters = [
    datePreset !== 'week' ? `Date: ${datePreset}` : null,
    behaviorId !== 'all' ? `Behavior: ${behaviors.find((b) => b.id === behaviorId)?.name ?? 'Selected'}` : null,
    setting !== 'all' ? `Setting: ${setting}` : null,
    incidentFunction !== 'all' ? `Function: ${incidentFunction}` : null,
    severity !== 'all' ? `Severity: ${severity}` : null,
    search.trim() ? `Search: “${search.trim()}”` : null,
  ].filter(Boolean) as string[]

  const clearFilters = () => {
    setDatePreset('week')
    setSearch('')
    setBehaviorId('all')
    setSetting('all')
    setIncidentFunction('all')
    setSeverity('all')
    setCustomStartDate(formatISO(subDays(new Date(), 30), { representation: 'date' }))
    setCustomEndDate(formatISO(new Date(), { representation: 'date' }))
    setVisibleCount(20)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="sticky top-16 z-20 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="grid gap-2 md:grid-cols-6">
          <Select value={datePreset} onValueChange={(value) => setDatePreset(value as DatePreset)}>
            <SelectTrigger><SelectValue placeholder="Date range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Select value={behaviorId} onValueChange={(value) => setBehaviorId(value ?? 'all')}>
            <SelectTrigger><SelectValue placeholder="Behavior" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All behaviors</SelectItem>
              {behaviors.map((behavior) => (
                <SelectItem key={behavior.id} value={behavior.id}>{behavior.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={setting} onValueChange={(value) => setSetting(value as typeof setting)}>
            <SelectTrigger><SelectValue placeholder="Setting" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All settings</SelectItem>
              {SETTINGS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={incidentFunction} onValueChange={(value) => setIncidentFunction(value as typeof incidentFunction)}>
            <SelectTrigger><SelectValue placeholder="Function" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All functions</SelectItem>
              {behaviorFunctions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severity} onValueChange={(value) => setSeverity(value as typeof severity)}>
            <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severity levels</SelectItem>
              {severityOptions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes" />
          </div>
        </div>

        {datePreset === 'custom' && (
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
            <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="secondary">{filter}</Badge>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" /> Clear Filters
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-600">{filteredIncidents.length} incidents found</p>

      {loading && <Card><CardContent className="p-4 text-sm text-slate-500">Loading incidents…</CardContent></Card>}
      {error && <Card><CardContent className="p-4 text-sm text-red-600">Failed to load incidents: {error}</CardContent></Card>}

      {!loading && !error && filteredIncidents.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-slate-600">
            No incidents recorded yet. Tap + to log your first observation.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {filteredIncidents.slice(0, visibleCount).map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>

      {visibleCount < filteredIncidents.length && (
        <Button variant="outline" className="w-full" onClick={() => setVisibleCount((prev) => prev + 20)}>
          Load More
        </Button>
      )}
    </div>
  )
}
