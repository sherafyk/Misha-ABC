import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronRight, Dot } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Incident } from '@/lib/types/database'

interface IncidentTimelineCardProps {
  incidents: Incident[]
}

const severityStyles: Record<string, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  crisis: 'bg-red-500',
}

export function IncidentTimelineCard({ incidents }: IncidentTimelineCardProps) {
  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base md:text-lg">Recent Incidents</CardTitle>
        <Link href="/incidents" className="text-sm font-medium text-blue-700 hover:text-blue-800">
          View All
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {incidents.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No incidents recorded yet.</p>
        ) : (
          incidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">{format(new Date(incident.occurred_at), 'EEE, h:mm a')}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${severityStyles[incident.severity] ?? 'bg-slate-400'}`} />
                  <p className="truncate text-sm font-medium text-slate-900">{incident.behavior?.name ?? 'Behavior'}</p>
                  <Dot className="h-4 w-4 text-slate-300" />
                  <Badge variant="outline" className="capitalize">{incident.setting}</Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">{incident.parent_raw_notes ?? 'No notes added'}</p>
              </div>
              <ChevronRight className="mt-4 h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
