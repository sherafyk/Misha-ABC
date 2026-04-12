'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAntecedents, useCreateAntecedent } from '@/lib/hooks/use-antecedents'
import { useBehaviors } from '@/lib/hooks/use-behaviors'
import { useConsequences } from '@/lib/hooks/use-consequences'
import { useCreateIncident, useUpdateIncident } from '@/lib/hooks/use-incidents'
import { quickLogSchema, type QuickLogValues } from '@/lib/types/schemas'
import type { AntecedentOption, BehaviorDefinition, ConsequenceOption } from '@/lib/types/database'
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

const REPEATED_BEHAVIOR_PRESET = {
  id: 'repeat-tantrum-after-drop',
  label: 'Repeat: Tantrum after dropped toy',
  details:
    "Logs now at Home for 1 minute with antecedent “Accidentally dropped toy or item”, behavior “Tantrum” (Low), and attention-based consequence.",
  setting: 'home' as const,
  durationSeconds: 60,
  antecedentLabel: 'Accidentally dropped toy or item',
  antecedentCategory: 'environmental',
  behaviorLabel: 'Tantrum',
  behaviorNotes:
    "Playing with toy and it fell from child's hands. Threw a mild tantrum, mostly verbal/yelling.",
  severity: 'low' as const,
  consequenceLabel: 'Attention provided (comfort, discussion)',
  parentRawNotes: 'Calms down shortly after, generally lasts less than 1 minute.',
} as const

const FALLBACK_ANTECEDENT_LABEL = 'Preferred item/activity removed'

function findByLabel<T extends { label?: string; name?: string }>(items: T[], label: string): T | undefined {
  const normalized = label.trim().toLowerCase()
  return items.find((item) => (item.label ?? item.name ?? '').trim().toLowerCase() === normalized)
}

export function QuickLog() {
  const { behaviors } = useBehaviors()
  const { antecedents } = useAntecedents()
  const { createAntecedent, loading: creatingAntecedent } = useCreateAntecedent()
  const { consequences } = useConsequences()
  const { createIncident, loading: creatingIncident } = useCreateIncident()
  const { updateIncident, loading: updatingIncident } = useUpdateIncident()
  const [isParsing, setIsParsing] = useState(false)

  const form = useForm<QuickLogValues>({
    resolver: zodResolver(quickLogSchema),
    defaultValues: { summary: '' },
  })

  const createPresetIncident = async () => {
    const behavior = findByLabel<BehaviorDefinition>(behaviors, REPEATED_BEHAVIOR_PRESET.behaviorLabel)
    if (!behavior) {
      toast.error(`Behavior "${REPEATED_BEHAVIOR_PRESET.behaviorLabel}" is missing. Add it in Settings before using this quick button.`)
      return
    }

    const antecedent =
      findByLabel<AntecedentOption>(antecedents, REPEATED_BEHAVIOR_PRESET.antecedentLabel) ??
      findByLabel<AntecedentOption>(antecedents, FALLBACK_ANTECEDENT_LABEL)
    if (!antecedent) {
      toast.error('No antecedent options are available. Please add one in Settings.')
      return
    }

    const consequence = findByLabel<ConsequenceOption>(consequences, REPEATED_BEHAVIOR_PRESET.consequenceLabel)
    if (!consequence) {
      toast.error(`Consequence "${REPEATED_BEHAVIOR_PRESET.consequenceLabel}" is missing. Ask an admin to seed default consequences.`)
      return
    }

    const { error } = await createIncident({
      occurred_at: new Date().toISOString(),
      duration_seconds: REPEATED_BEHAVIOR_PRESET.durationSeconds,
      setting: REPEATED_BEHAVIOR_PRESET.setting,
      setting_detail: null,
      antecedent_ids: [antecedent.id],
      antecedent_notes:
        antecedent.label === REPEATED_BEHAVIOR_PRESET.antecedentLabel
          ? null
          : `${REPEATED_BEHAVIOR_PRESET.antecedentLabel} (${REPEATED_BEHAVIOR_PRESET.antecedentCategory})`,
      behavior_id: behavior.id,
      behavior_notes: REPEATED_BEHAVIOR_PRESET.behaviorNotes,
      severity: REPEATED_BEHAVIOR_PRESET.severity,
      consequence_ids: [consequence.id],
      consequence_notes: null,
      hypothesized_function: 'unknown',
      parent_raw_notes: REPEATED_BEHAVIOR_PRESET.parentRawNotes,
      ai_formatted_notes: null,
      people_present: null,
      environmental_factors: null,
      mood_before: null,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    if (antecedent.label !== REPEATED_BEHAVIOR_PRESET.antecedentLabel) {
      toast.info(`Saved using "${antecedent.label}" plus notes because the exact antecedent is not available.`)
    }

    toast.success('Repeated tantrum incident logged.')
  }

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

  const isSubmitting = creatingIncident || updatingIncident || isParsing || creatingAntecedent

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Quick Caretaker Input</CardTitle>
        <CardDescription>
          Type what happened. We save your original note immediately, then AI maps it to antecedent, behavior, and consequence options.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">One-tap repeated incidents</p>
          <AlertDialog>
            <AlertDialogTrigger
              disabled={isSubmitting}
              render={<Button className="h-11 w-full justify-start" type="button" variant="secondary" />}
            >
              {REPEATED_BEHAVIOR_PRESET.label}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log this repeated incident now?</AlertDialogTitle>
                <AlertDialogDescription>{REPEATED_BEHAVIOR_PRESET.details}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={isSubmitting} onClick={() => void createPresetIncident()}>
                  {isSubmitting ? 'Logging…' : 'Confirm & log'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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
