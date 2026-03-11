'use client'

import { useMemo, useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'

import { AntecedentBar } from '@/components/charts/antecedent-bar'
import { ABCPatternFlow } from '@/components/charts/abc-pattern-flow'
import { CalendarHeatmap } from '@/components/charts/calendar-heatmap'
import { ConsequenceBar } from '@/components/charts/consequence-bar'
import { CorrelationScatter } from '@/components/charts/correlation-scatter'
import { FunctionDonut } from '@/components/charts/function-donut'
import { IncidentsOverTime } from '@/components/charts/incidents-over-time'
import { SettingBreakdown } from '@/components/charts/setting-breakdown'
import { SeverityStackedBar } from '@/components/charts/severity-stacked-bar'
import { TimeOfDayHeatmap } from '@/components/charts/time-of-day-heatmap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BEHAVIOR_FUNCTIONS, SETTINGS } from '@/lib/constants/abc-options'
import { useBehaviors } from '@/lib/hooks/use-behaviors'
import { useDailyLogs } from '@/lib/hooks/use-daily-logs'
import { useIncidents } from '@/lib/hooks/use-incidents'

const severityScore = { low: 1, medium: 2, high: 3, crisis: 4 } as const

function topN(map: Map<string, number>, n = 10) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }))
}

function getDateSeries(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = subDays(new Date(), days - index - 1)
    return format(date, 'yyyy-MM-dd')
  })
}

export default function ReportsPage() {
  const [range, setRange] = useState<'7' | '30' | '90'>('30')
  const [selectedBehaviorId, setSelectedBehaviorId] = useState<string>('all')

  const days = Number(range)
  const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')

  const { incidents, loading, error } = useIncidents({ startDate })
  const { dailyLogs } = useDailyLogs({ startDate })
  const { behaviors } = useBehaviors()

  const filteredBehaviorIncidents = useMemo(
    () =>
      selectedBehaviorId === 'all'
        ? incidents
        : incidents.filter((incident) => incident.behavior_id === selectedBehaviorId),
    [incidents, selectedBehaviorId],
  )

  const metrics = useMemo(() => {
    const total = incidents.length
    const avg = days ? total / days : 0

    const behaviorMap = new Map<string, number>()
    const functionMap = new Map<string, number>()
    const antecedentMap = new Map<string, number>()

    incidents.forEach((incident) => {
      const behavior = incident.behavior?.name ?? 'Unknown behavior'
      behaviorMap.set(behavior, (behaviorMap.get(behavior) ?? 0) + 1)
      functionMap.set(incident.hypothesized_function, (functionMap.get(incident.hypothesized_function) ?? 0) + 1)
      ;(incident.antecedents ?? []).forEach((ant) => {
        antecedentMap.set(ant.label, (antecedentMap.get(ant.label) ?? 0) + 1)
      })
    })

    const best = (map: Map<string, number>) => [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No data'
    return {
      total,
      avg: avg.toFixed(1),
      behavior: best(behaviorMap),
      fn: best(functionMap),
      antecedent: best(antecedentMap),
    }
  }, [incidents, days])

  const dateSeries = useMemo(() => getDateSeries(days), [days])

  const incidentsOverTime = useMemo(
    () =>
      dateSeries.map((date) => ({
        date: format(parseISO(date), 'MMM d'),
        incidents: incidents.filter((incident) => format(new Date(incident.occurred_at), 'yyyy-MM-dd') === date).length,
      })),
    [dateSeries, incidents],
  )

  const severityStacked = useMemo(
    () =>
      dateSeries.map((date) => {
        const dayIncidents = incidents.filter((incident) => format(new Date(incident.occurred_at), 'yyyy-MM-dd') === date)
        return {
          date: format(parseISO(date), 'MMM d'),
          low: dayIncidents.filter((x) => x.severity === 'low').length,
          medium: dayIncidents.filter((x) => x.severity === 'medium').length,
          high: dayIncidents.filter((x) => x.severity === 'high').length,
          crisis: dayIncidents.filter((x) => x.severity === 'crisis').length,
        }
      }),
    [dateSeries, incidents],
  )

  const functionDonut = BEHAVIOR_FUNCTIONS.map((item) => ({
    name: item.label,
    value: incidents.filter((incident) => incident.hypothesized_function === item.value).length,
    color: item.color,
  })).filter((item) => item.value > 0)

  const antecedentBar = useMemo(() => {
    const map = new Map<string, number>()
    incidents.forEach((incident) => {
      ;(incident.antecedents ?? []).forEach((item) => {
        map.set(item.label, (map.get(item.label) ?? 0) + 1)
      })
    })
    return topN(map)
  }, [incidents])

  const consequenceBar = useMemo(() => {
    const map = new Map<string, number>()
    incidents.forEach((incident) => {
      ;(incident.consequences ?? []).forEach((item) => {
        map.set(item.label, (map.get(item.label) ?? 0) + 1)
      })
    })
    return topN(map)
  }, [incidents])

  const timeOfDayHeatmap = useMemo(() => {
    const map = new Map<string, number>()
    filteredBehaviorIncidents.forEach((incident) => {
      const date = new Date(incident.occurred_at)
      const day = format(date, 'EEE')
      const hour = date.getHours()
      const key = `${day}-${hour}`
      map.set(key, (map.get(key) ?? 0) + 1)
    })

    return [...map.entries()].map(([key, count]) => {
      const [day, hour] = key.split('-')
      return { day, hour: Number(hour), count }
    })
  }, [filteredBehaviorIncidents])

  const settingBreakdown = useMemo(
    () =>
      SETTINGS.map((setting, index) => ({
        name: setting.label,
        value: filteredBehaviorIncidents.filter((incident) => incident.setting === setting.value).length,
        color: ['#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#6b7280'][index] ?? '#64748b',
      })).filter((item) => item.value > 0),
    [filteredBehaviorIncidents],
  )

  const abcFlow = useMemo(() => {
    const nodes: { name: string }[] = []
    const nodeMap = new Map<string, number>()
    const links = new Map<string, { source: number; target: number; value: number }>()

    const ensureNode = (name: string) => {
      if (nodeMap.has(name)) return nodeMap.get(name) as number
      const index = nodes.push({ name }) - 1
      nodeMap.set(name, index)
      return index
    }

    incidents.slice(0, 100).forEach((incident) => {
      const ant = incident.antecedents?.[0]?.label ?? 'Antecedent: unspecified'
      const beh = incident.behavior?.name ?? 'Behavior: unspecified'
      const cons = incident.consequences?.[0]?.label ?? 'Consequence: unspecified'
      const fn = `Function: ${incident.hypothesized_function}`

      const ai = ensureNode(ant)
      const bi = ensureNode(beh)
      const ci = ensureNode(cons)
      const fi = ensureNode(fn)

      const pairs = [
        [ai, bi],
        [bi, ci],
        [ci, fi],
      ] as const

      pairs.forEach(([source, target]) => {
        const key = `${source}-${target}`
        const existing = links.get(key)
        links.set(key, { source, target, value: (existing?.value ?? 0) + 1 })
      })
    })

    return { nodes, links: [...links.values()] }
  }, [incidents])

  const chainRows = useMemo(() => {
    const map = new Map<string, number>()
    incidents.forEach((incident) => {
      const key = `${incident.antecedents?.[0]?.label ?? 'Unspecified antecedent'} → ${incident.behavior?.name ?? 'Unspecified behavior'} → ${incident.consequences?.[0]?.label ?? 'Unspecified consequence'}`
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [incidents])

  const calendarData = dateSeries.map((date) => ({
    date,
    count: incidents.filter((incident) => format(new Date(incident.occurred_at), 'yyyy-MM-dd') === date).length,
  }))

  const correlationData = dailyLogs.map((log) => {
    const count = incidents.filter((incident) => format(new Date(incident.occurred_at), 'yyyy-MM-dd') === log.log_date).length
    return {
      x: log.sleep_hours ?? 0,
      y: count,
      label: log.log_date,
    }
  })

  const moodSeverityData = dailyLogs.map((log) => {
    const dayIncidents = incidents.filter((incident) => format(new Date(incident.occurred_at), 'yyyy-MM-dd') === log.log_date)
    const avgSeverity = dayIncidents.length
      ? dayIncidents.reduce((sum, incident) => sum + severityScore[incident.severity], 0) / dayIncidents.length
      : 0

    const moodWeight = ['Sad', 'Anxious', 'Irritable'].includes(log.overall_mood ?? '') ? 3 : ['Neutral', 'Tired'].includes(log.overall_mood ?? '') ? 2 : 1

    return {
      x: moodWeight,
      y: Number(avgSeverity.toFixed(2)),
      label: log.log_date,
    }
  })

  const medicationData = dailyLogs.map((log) => {
    const count = incidents.filter((incident) => format(new Date(incident.occurred_at), 'yyyy-MM-dd') === log.log_date).length
    return {
      x: log.medication_given ? 1 : 0,
      y: count,
      label: log.log_date,
    }
  })

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reports & Data Visualization</CardTitle>
          <Select value={range} onValueChange={(value: '7' | '30' | '90') => setRange(value)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {loading && <Card><CardContent className="p-4 text-sm text-slate-600">Loading report data…</CardContent></Card>}
      {error && <Card><CardContent className="p-4 text-sm text-red-600">Failed to load reports: {error}</CardContent></Card>}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 md:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="behavior">Behavior Analysis</TabsTrigger>
          <TabsTrigger value="patterns">ABC Patterns</TabsTrigger>
          <TabsTrigger value="daily">Daily Trends</TabsTrigger>
          <TabsTrigger value="export">Export & Share</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total incidents</p><p className="text-2xl font-semibold">{metrics.total}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Avg/day</p><p className="text-2xl font-semibold">{metrics.avg}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Most common behavior</p><p className="text-sm font-semibold">{metrics.behavior}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Most common function</p><p className="text-sm font-semibold">{metrics.fn}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Most common antecedent</p><p className="text-sm font-semibold">{metrics.antecedent}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Trend</p><p className="text-2xl font-semibold">{incidentsOverTime.at(-1)?.incidents ?? 0 >= incidentsOverTime.at(0)?.incidents ?? 0 ? '↑' : '↓'}</p></CardContent></Card>
          </div>

          <Card><CardHeader><CardTitle>Incidents Over Time</CardTitle></CardHeader><CardContent><IncidentsOverTime data={incidentsOverTime} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Severity Over Time</CardTitle></CardHeader><CardContent><SeverityStackedBar data={severityStacked} /></CardContent></Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Function Distribution</CardTitle></CardHeader><CardContent>{functionDonut.length ? <FunctionDonut data={functionDonut} /> : <p className="text-sm text-slate-500">No function data yet.</p>}</CardContent></Card>
            <Card><CardHeader><CardTitle>Top Antecedents</CardTitle></CardHeader><CardContent>{antecedentBar.length ? <AntecedentBar data={antecedentBar} /> : <p className="text-sm text-slate-500">No antecedents yet.</p>}</CardContent></Card>
          </div>

          <Card><CardHeader><CardTitle>Top Consequences</CardTitle></CardHeader><CardContent>{consequenceBar.length ? <ConsequenceBar data={consequenceBar} /> : <p className="text-sm text-slate-500">No consequences yet.</p>}</CardContent></Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <Select value={selectedBehaviorId} onValueChange={setSelectedBehaviorId}>
                <SelectTrigger className="w-full md:w-96"><SelectValue placeholder="Select behavior" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All behaviors</SelectItem>
                  {behaviors.map((behavior) => <SelectItem key={behavior.id} value={behavior.id}>{behavior.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle>Frequency Over Time</CardTitle></CardHeader><CardContent><IncidentsOverTime data={incidentsOverTime.map((item) => ({ ...item, incidents: filteredBehaviorIncidents.filter((incident) => format(new Date(incident.occurred_at), 'MMM d') === item.date).length }))} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Severity Distribution</CardTitle></CardHeader><CardContent><SeverityStackedBar data={severityStacked.map((item) => ({
            ...item,
            low: filteredBehaviorIncidents.filter((incident) => incident.severity === 'low' && format(new Date(incident.occurred_at), 'MMM d') === item.date).length,
            medium: filteredBehaviorIncidents.filter((incident) => incident.severity === 'medium' && format(new Date(incident.occurred_at), 'MMM d') === item.date).length,
            high: filteredBehaviorIncidents.filter((incident) => incident.severity === 'high' && format(new Date(incident.occurred_at), 'MMM d') === item.date).length,
            crisis: filteredBehaviorIncidents.filter((incident) => incident.severity === 'crisis' && format(new Date(incident.occurred_at), 'MMM d') === item.date).length,
          }))} /></CardContent></Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Time-of-Day Heatmap</CardTitle></CardHeader><CardContent>{timeOfDayHeatmap.length ? <TimeOfDayHeatmap data={timeOfDayHeatmap} /> : <p className="text-sm text-slate-500">No time-of-day data yet.</p>}</CardContent></Card>
            <Card><CardHeader><CardTitle>Setting Breakdown</CardTitle></CardHeader><CardContent>{settingBreakdown.length ? <SettingBreakdown data={settingBreakdown} /> : <p className="text-sm text-slate-500">No setting data yet.</p>}</CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card><CardHeader><CardTitle>Antecedent → Behavior → Consequence → Function Flow</CardTitle></CardHeader><CardContent>{abcFlow.nodes.length ? <ABCPatternFlow nodes={abcFlow.nodes} links={abcFlow.links} /> : <p className="text-sm text-slate-500">No pattern data yet.</p>}</CardContent></Card>
          <Card>
            <CardHeader><CardTitle>Most Common ABC Chains</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Pattern</TableHead><TableHead className="w-24 text-right">Count</TableHead></TableRow></TableHeader>
                <TableBody>
                  {chainRows.map(([pattern, count]) => (
                    <TableRow key={pattern}><TableCell>{pattern}</TableCell><TableCell className="text-right">{count}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pattern Detection Insights</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {chainRows.slice(0, 3).map(([pattern, count]) => (
                <p key={pattern} className="text-sm text-slate-700">When <Badge variant="secondary">{pattern}</Badge> occurred, it appeared {count} times in this range.</p>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card><CardHeader><CardTitle>Calendar Heatmap</CardTitle></CardHeader><CardContent><CalendarHeatmap data={calendarData} /></CardContent></Card>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card><CardHeader><CardTitle>Sleep Hours vs Incident Count</CardTitle></CardHeader><CardContent><CorrelationScatter data={correlationData} xLabel="Sleep Hours" yLabel="Incidents" /></CardContent></Card>
            <Card><CardHeader><CardTitle>Mood vs Avg Severity</CardTitle></CardHeader><CardContent><CorrelationScatter data={moodSeverityData} xLabel="Mood Index" yLabel="Avg Severity" /></CardContent></Card>
            <Card><CardHeader><CardTitle>Medication vs Incidents</CardTitle></CardHeader><CardContent><CorrelationScatter data={medicationData} xLabel="Medication Given (0/1)" yLabel="Incidents" /></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Export & Share</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => window.open(`/api/export?format=pdf&startDate=${startDate}`, '_blank')}>Generate PDF Report</Button>
              <Button variant="outline" onClick={() => window.open(`/api/export?format=csv&startDate=${startDate}`, '_blank')}>Export CSV</Button>
              <Button variant="secondary">Generate AI Progress Summary</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
