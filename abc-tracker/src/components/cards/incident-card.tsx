'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight, MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Incident } from '@/lib/types/database'

interface IncidentCardProps {
  incident: Incident
}

const severityClasses: Record<string, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  crisis: 'bg-red-500',
}

export function IncidentCard({ incident }: IncidentCardProps) {
  return (
    <Link href={`/incidents/${incident.id}`} className="block">
      <Card className="rounded-xl border-slate-200 shadow-sm transition hover:border-blue-200 hover:shadow">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">{format(new Date(incident.occurred_at), 'PPP • p')}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{incident.behavior?.name ?? 'Behavior'}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
              <span className={`h-2 w-2 rounded-full ${severityClasses[incident.severity] ?? 'bg-slate-400'}`} />
              {incident.severity}
            </span>
            <Badge variant="outline" className="capitalize">{incident.hypothesized_function}</Badge>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700 capitalize">
              <MapPin className="h-3 w-3" /> {incident.setting}
            </span>
          </div>

          <p className="line-clamp-1 text-sm text-slate-600">{incident.parent_raw_notes ?? 'No notes added.'}</p>

          <p className="text-xs text-slate-500">
            {incident.antecedents?.length ?? incident.antecedent_ids.length} antecedent(s)
            <span className="mx-1">→</span>
            {incident.consequences?.length ?? incident.consequence_ids.length} consequence(s)
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
