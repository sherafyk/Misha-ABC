'use client'

import { ArrowRight } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Incident } from '@/lib/types/database'

interface ABCFlowDisplayProps {
  incident: Incident
}

function FlowColumn({ title, items, notes }: { title: string; items: string[]; notes?: string | null }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No selections recorded.</p>
        )}
        {notes ? <p className="rounded-lg bg-slate-50 p-2 text-sm text-slate-600">{notes}</p> : null}
      </CardContent>
    </Card>
  )
}

export function ABCFlowDisplay({ incident }: ABCFlowDisplayProps) {
  const antecedents = incident.antecedents?.map((item) => item.label) ?? []
  const consequences = incident.consequences?.map((item) => item.label) ?? []

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
      <FlowColumn title="Antecedent" items={antecedents} notes={incident.antecedent_notes} />
      <div className="hidden items-center justify-center text-slate-300 md:flex"><ArrowRight className="h-5 w-5" /></div>
      <FlowColumn
        title="Behavior"
        items={[incident.behavior?.name ?? 'Behavior not selected']}
        notes={incident.behavior_notes}
      />
      <div className="hidden items-center justify-center text-slate-300 md:flex"><ArrowRight className="h-5 w-5" /></div>
      <FlowColumn title="Consequence" items={consequences} notes={incident.consequence_notes} />
    </div>
  )
}
