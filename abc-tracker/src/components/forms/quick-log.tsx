'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAntecedents } from '@/lib/hooks/use-antecedents'
import { useBehaviors } from '@/lib/hooks/use-behaviors'
import { useConsequences } from '@/lib/hooks/use-consequences'
import { useCreateIncident, useUpdateIncident } from '@/lib/hooks/use-incidents'
import { quickLogSchema, type QuickLogValues } from '@/lib/types/schemas'
import type { BehaviorFunction, BehaviorSeverity, IncidentSetting } from '@/lib/types/database'

interface QuickLogParseResponse {
  occurred_at?: string
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
  const { createIncident, loading: creatingIncident } = useCreateIncident()
  const { updateIncident, loading: updatingIncident } = useUpdateIncident()
  const [isParsing, setIsParsing] = useState(false)

  const form = useForm<QuickLogValues>({
    resolver: zodResolver(quickLogSchema),
    defaultValues: { summary: '' },
  })

  const onSubmit = async (values: QuickLogValues) => {
    if (!behaviors.length) {
      toast.error('No behaviors are configured yet. Ask an admin to add at least one behavior definition.')
      return
    }

    const occurredAt = new Date().toISOString()

    try {
      const initialIncident = {
        occurred_at: occurredAt,
        duration_seconds: null,
        setting: 'other' as const,
        setting_detail: 'Quick caretaker input',
        antecedent_ids: [],
        antecedent_notes: null,
        behavior_id: behaviors[0].id,
        behavior_notes: null,
        severity: 'medium' as const,
        consequence_ids: [],
        consequence_notes: null,
        hypothesized_function: 'unknown' as const,
        parent_raw_notes: values.summary,
        ai_formatted_notes: null,
        people_present: null,
        environmental_factors: null,
        mood_before: null,
      }

      const { data: createdIncident, error: createError } = await createIncident(initialIncident)
      if (createError || !createdIncident) {
        throw createError ?? new Error('Unable to save quick log note')
      }

      toast.success('Quick note saved. AI is analyzing your note now…')
      form.reset({ summary: '' })
      setIsParsing(true)

      try {
        const aiResponse = await fetch('/api/ai/quick-log-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: values.summary,
            occurred_at: occurredAt,
            behaviors: behaviors.map((behavior) => ({ id: behavior.id, label: behavior.name })),
            antecedents: antecedents.map((item) => ({ id: item.id, label: item.label })),
            consequences: consequences.map((item) => ({ id: item.id, label: item.label })),
          }),
        })

        const aiBody = (await aiResponse.json()) as QuickLogParseResponse & { error?: string }
        if (!aiResponse.ok) {
          throw new Error(aiBody.error ?? 'Unable to parse quick log with AI')
        }

        const { error: updateError } = await updateIncident(createdIncident.id, {
          occurred_at: aiBody.occurred_at ?? occurredAt,
          setting: aiBody.setting,
          antecedent_ids: aiBody.antecedent_ids,
          behavior_id: aiBody.behavior_id,
          severity: aiBody.severity,
          consequence_ids: aiBody.consequence_ids,
          hypothesized_function: aiBody.hypothesized_function,
          ai_formatted_notes: aiBody.ai_formatted_notes,
        })

        if (updateError) {
          throw updateError
        }

        toast.success('Incident updated with AI ABC mapping.')
      } catch (aiError) {
        toast.warning(
          aiError instanceof Error
            ? `Incident saved, but AI parsing failed: ${aiError.message}`
            : 'Incident saved, but AI parsing failed. You can retry from incident details.',
        )
      } finally {
        setIsParsing(false)
      }
    } catch (error) {
      setIsParsing(false)
      toast.error(error instanceof Error ? error.message : 'Unable to save quick log')
    }
  }

  const isSubmitting = creatingIncident || updatingIncident || isParsing

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Quick Caretaker Input</CardTitle>
        <CardDescription>
          Type what happened. We save your original note immediately, then AI maps it to antecedent, behavior, and consequence options.
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
          <Button className="h-11 w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Saving…' : 'Log incident now'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
