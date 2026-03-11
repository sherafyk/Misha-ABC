import { Activity, AlertTriangle, Lightbulb, Shapes } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TodaySnapshotCardProps {
  incidentsToday: number
  commonBehavior: string
  commonAntecedent: string
  dominantFunction: string
  averageSeverity: string
}

export function TodaySnapshotCard({
  incidentsToday,
  commonBehavior,
  commonAntecedent,
  dominantFunction,
  averageSeverity,
}: TodaySnapshotCardProps) {
  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Today&apos;s Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="flex items-center gap-2 text-xs text-slate-500"><Activity className="h-4 w-4" /> Incidents</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{incidentsToday}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="flex items-center gap-2 text-xs text-slate-500"><AlertTriangle className="h-4 w-4" /> Avg Severity</p>
          <p className="mt-1 text-lg font-semibold capitalize text-slate-900">{averageSeverity}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="flex items-center gap-2 text-xs text-slate-500"><Shapes className="h-4 w-4" /> Common behavior</p>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-800">{commonBehavior}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="flex items-center gap-2 text-xs text-slate-500"><Lightbulb className="h-4 w-4" /> Dominant function</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{dominantFunction}</p>
        </div>
        <div className="sm:col-span-2 rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-700">Most common antecedent</p>
          <p className="mt-1 text-sm font-medium text-blue-900">{commonAntecedent}</p>
        </div>
      </CardContent>
    </Card>
  )
}
