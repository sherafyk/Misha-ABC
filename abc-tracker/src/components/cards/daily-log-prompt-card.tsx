import Link from 'next/link'
import { MoonStar, NotebookPen } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyLog } from '@/lib/types/database'

interface DailyLogPromptCardProps {
  todayLog: DailyLog | null
}

export function DailyLogPromptCard({ todayLog }: DailyLogPromptCardProps) {
  if (!todayLog) {
    return (
      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Daily Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">No daily log has been added for today.</p>
          <Link
            href="/settings"
            className="mt-3 inline-flex h-11 items-center rounded-lg bg-teal-500 px-4 text-sm font-medium text-white transition hover:bg-teal-600"
          >
            <NotebookPen className="mr-2 h-4 w-4" />
            Write Daily Note
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Today&apos;s Daily Log</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Mood</p>
          <p className="mt-1 font-medium text-slate-900">{todayLog.overall_mood ?? 'Not specified'}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="flex items-center gap-1 text-xs text-slate-500"><MoonStar className="h-3.5 w-3.5" /> Sleep</p>
          <p className="mt-1 font-medium text-slate-900">{todayLog.sleep_hours ? `${todayLog.sleep_hours} hrs` : 'Not logged'}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Medication</p>
          <p className="mt-1 font-medium text-slate-900">{todayLog.medication_given ? 'Given' : 'Not given'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
