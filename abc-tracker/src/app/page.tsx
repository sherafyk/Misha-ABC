'use client'

import Link from 'next/link'
import { format, isToday, subDays } from 'date-fns'
import { BarChart3, ClipboardPlus, FileText, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DailyLogPromptCard } from '@/components/cards/daily-log-prompt-card'
import { IncidentTimelineCard } from '@/components/cards/incident-timeline-card'
import { QuickActionCard } from '@/components/cards/quick-action-card'
import { TodaySnapshotCard } from '@/components/cards/today-snapshot-card'
import { FunctionDonutChart } from '@/components/charts/function-donut-chart'
import { WeeklyBarChart } from '@/components/charts/weekly-bar-chart'
import { BEHAVIOR_FUNCTIONS } from '@/lib/constants/abc-options'
import { useChildProfile } from '@/lib/hooks/use-child-profile'
import { useDailyLogs } from '@/lib/hooks/use-daily-logs'
import { useIncidents } from '@/lib/hooks/use-incidents'

const quickActions = [
  { title: 'Log New Incident', description: 'Open the full ABC logging wizard.', href: '/log', icon: ClipboardPlus },
  { title: 'Write Daily Note', description: 'Capture mood, sleep, and medication context.', href: '/settings', icon: FileText },
  { title: 'View Reports', description: 'Explore trends and patterns over time.', href: '/reports', icon: BarChart3 },
  { title: 'AI Notes', description: 'Generate provider-ready clinical notes.', href: '/ai-notes', icon: Sparkles },
] as const

const severityWeight = { low: 1, medium: 2, high: 3, crisis: 4 } as const
const severityLabel = ['Low', 'Medium', 'High', 'Crisis'] as const

function mode(values: string[]) {
  const map = new Map<string, number>()
  values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1))
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No data yet'
}

export default function DashboardPage() {
  const { profile } = useChildProfile()
  const { incidents, loading, error } = useIncidents()
  const { dailyLogs } = useDailyLogs()

  const todayIncidents = incidents.filter((incident) => isToday(new Date(incident.occurred_at)))
  const recentIncidents = incidents.slice(0, 5)

  const todayBehavior = mode(todayIncidents.map((incident) => incident.behavior?.name ?? 'Unknown behavior'))
  const todayAntecedent = mode(todayIncidents.flatMap((incident) => incident.antecedents?.map((a) => a.label) ?? []))
  const todayFunctionValue = mode(todayIncidents.map((incident) => incident.hypothesized_function))
  const todayFunctionLabel = BEHAVIOR_FUNCTIONS.find((f) => f.value === todayFunctionValue)?.label ?? 'Unknown / Uncertain'

  const avgSeverityRaw =
    todayIncidents.length === 0
      ? 0
      : Math.round(
          todayIncidents.reduce((sum, incident) => sum + severityWeight[incident.severity], 0) / todayIncidents.length,
        )
  const avgSeverity = avgSeverityRaw === 0 ? 'No data' : severityLabel[Math.min(avgSeverityRaw - 1, severityLabel.length - 1)]

  const weekData = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(new Date(), 6 - index)
    const count = incidents.filter(
      (incident) => format(new Date(incident.occurred_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'),
    ).length

    return {
      day: format(date, 'EEE'),
      incidents: count,
    }
  })

  const functionData = BEHAVIOR_FUNCTIONS.map((fn) => ({
    name: fn.label,
    value: incidents.filter((incident) => incident.hypothesized_function === fn.value).length,
    color: fn.color,
  })).filter((item) => item.value > 0)

  const todayLog = dailyLogs.find((log) => isToday(new Date(log.log_date))) ?? null

  const childName = profile?.first_name ?? 'your child'
  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-medium text-teal-600">Good {greeting}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Here&apos;s {childName}&apos;s day so far.
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{todayIncidents.length} incidents today</Badge>
          <Link href="/log" className="text-sm font-medium text-blue-700 underline-offset-2 hover:underline">
            Quick-log incident
          </Link>
        </div>
      </section>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">Unable to load dashboard data: {error}</CardContent>
        </Card>
      )}

      <TodaySnapshotCard
        incidentsToday={todayIncidents.length}
        commonBehavior={todayBehavior}
        commonAntecedent={todayAntecedent}
        dominantFunction={todayFunctionLabel}
        averageSeverity={avgSeverity}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <IncidentTimelineCard incidents={recentIncidents} />

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Weekly Trend</h3>
              <Link href="/reports" className="text-sm font-medium text-blue-700 hover:text-blue-800">Open Reports</Link>
            </div>
            <WeeklyBarChart data={weekData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <h3 className="mb-3 text-base font-semibold text-slate-900">Function Breakdown (This Week)</h3>
            {functionData.length > 0 ? (
              <>
                <FunctionDonutChart data={functionData} />
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {functionData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}
                      </span>
                      <span className="font-medium text-slate-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No weekly function data yet.</p>
            )}
          </CardContent>
        </Card>

        <DailyLogPromptCard todayLog={todayLog} />
      </div>

      <section>
        <h3 className="mb-3 text-base font-semibold text-slate-900">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.href} {...action} />
          ))}
        </div>
      </section>

      {loading && <p className="text-sm text-slate-500">Loading dashboard data...</p>}
    </div>
  )
}
