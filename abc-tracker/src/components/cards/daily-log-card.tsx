import { format } from 'date-fns'
import { MoonStar, Pill } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyLog } from '@/lib/types/database'

interface DailyLogCardProps {
  log: DailyLog
}

export function DailyLogCard({ log }: DailyLogCardProps) {
  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Daily Log — {format(new Date(log.log_date), 'MMM d, yyyy')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Mood</p>
          <p className="mt-1 font-medium text-slate-900">{log.overall_mood ?? 'Not specified'}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="flex items-center gap-1 text-xs text-slate-500"><MoonStar className="h-3.5 w-3.5" /> Sleep</p>
          <p className="mt-1 font-medium text-slate-900">{log.sleep_hours ? `${log.sleep_hours} hrs (${log.sleep_quality ?? 'quality n/a'})` : 'Not logged'}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="flex items-center gap-1 text-xs text-slate-500"><Pill className="h-3.5 w-3.5" /> Medication</p>
          <p className="mt-1 font-medium text-slate-900">{log.medication_given ? 'Given' : 'Not given'}</p>
        </div>
        {log.diet_notes && (
          <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2 lg:col-span-3">
            <p className="text-xs text-slate-500">Diet Notes</p>
            <p className="mt-1 text-slate-900">{log.diet_notes}</p>
          </div>
        )}
        {log.general_notes && (
          <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2 lg:col-span-3">
            <p className="text-xs text-slate-500">General Notes</p>
            <p className="mt-1 text-slate-900">{log.general_notes}</p>
          </div>
        )}
        {log.ai_formatted_summary && (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 sm:col-span-2 lg:col-span-3">
            <p className="text-xs text-teal-700">AI Summary</p>
            <p className="mt-1 text-slate-900">{log.ai_formatted_summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
