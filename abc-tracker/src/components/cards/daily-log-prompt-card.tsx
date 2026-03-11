import Link from 'next/link'
import { NotebookPen } from 'lucide-react'

import { DailyLogCard } from '@/components/cards/daily-log-card'
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
            href="/log"
            className="mt-3 inline-flex h-11 items-center rounded-lg bg-teal-500 px-4 text-sm font-medium text-white transition hover:bg-teal-600"
          >
            <NotebookPen className="mr-2 h-4 w-4" />
            Write Daily Note
          </Link>
        </CardContent>
      </Card>
    )
  }

  return <DailyLogCard log={todayLog} />
}
