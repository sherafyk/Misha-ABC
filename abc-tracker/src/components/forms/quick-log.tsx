'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAntecedents } from '@/lib/hooks/use-antecedents'
import { useBehaviors } from '@/lib/hooks/use-behaviors'
import { useConsequences } from '@/lib/hooks/use-consequences'
import { useCreateIncident } from '@/lib/hooks/use-incidents'
import { quickLogSchema, type QuickLogValues } from '@/lib/types/schemas'
import type { BehaviorFunction, BehaviorSeverity, IncidentSetting } from '@/lib/types/database'

interface QuickLogParseResponse {
  setting: IncidentSetting
  severity: BehaviorSeverity
  hypothesized_function: BehaviorFunction
  behavior_id: string
  antecedent_ids: string[]
  consequence_ids: string[]
  ai_formatted_notes: string
}

export function QuickLog() {
  const { behaviors } = useBehaviors()
  const { antecedents } = useAntecedents()
  const { consequences } = useConsequences()
  const { createIncident, loading } = useCreateIncident()

  const form = useForm<QuickLogValues>({
    resolver: zodResolver(quickLogSchema),
    defaultValues: { summary: '' },
  })

  const onSubmit = async (values: QuickLogValues) => {
    if (!behaviors.length) {
      toast.error('No behaviors are configured yet. Ask an admin to add at least one behavior definition.')
      return
    }

    try {
      const aiResponse = await fetch('/api/ai/quick-log-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: values.summary,
          behaviors: behaviors.map((behavior) => ({ id: behavior.id, label: behavior.name })),
          antecedents: antecedents.map((item) => ({ id: item.id, label: item.label })),
          consequences: consequences.map((item) => ({ id: item.id, label: item.label })),
        }),
      })

      const aiBody = (await aiResponse.json()) as QuickLogParseResponse & { error?: string }
      if (!aiResponse.ok) {
        throw new Error(aiBody.error ?? 'Unable to parse quick log with AI')
      }

      const payload = {
        occurred_at: new Date().toISOString(),
        duration_seconds: null,
        setting: aiBody.setting,
        setting_detail: null,
        antecedent_ids: aiBody.antecedent_ids,
        antecedent_notes: null,
        behavior_id: aiBody.behavior_id,
        behavior_notes: null,
        severity: aiBody.severity,
        consequence_ids: aiBody.consequence_ids,
        consequence_notes: null,
        hypothesized_function: aiBody.hypothesized_function,
        parent_raw_notes: values.summary,
        ai_formatted_notes: aiBody.ai_formatted_notes,
        people_present: null,
        environmental_factors: null,
        mood_before: null,
      }

      const { error } = await createIncident(payload)
      if (error) {
        throw error
      }

      toast.success('Incident logged. AI filled in ABC details for you.')
      form.reset({ summary: '' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save quick log')
    }
  }

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Quick Caretaker Input</CardTitle>
        <CardDescription>
          Type what happened. We log the timestamp as now and AI maps your note to antecedent, behavior, and consequence options.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Textarea
            rows={5}
            placeholder="Example: During homework, I asked him to put the tablet away and he screamed and dropped to the floor. I redirected to breathing and after a minute he calmed down."
            {...form.register('summary')}
          />
          {form.formState.errors.summary ? <p className="text-sm text-red-600">{form.formState.errors.summary.message}</p> : null}
          <Button className="h-11 w-full" disabled={loading} type="submit">{loading ? 'Saving…' : 'Log incident now'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
