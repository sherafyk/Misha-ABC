'use client'

import { useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useDailyLogs } from '@/lib/hooks/use-daily-logs'
import { useIncidents } from '@/lib/hooks/use-incidents'
import { dailyLogSchema, type DailyLogFormValues } from '@/lib/types/schemas'

const MOODS = [
  { value: '😊', label: 'Happy' },
  { value: '😐', label: 'Neutral' },
  { value: '😟', label: 'Worried' },
  { value: '😠', label: 'Irritable' },
  { value: '😴', label: 'Tired' },
  { value: '⚡', label: 'Energetic' },
] as const

const SLEEP_QUALITY = ['Poor', 'Fair', 'Good', 'Excellent'] as const
const SLEEP_HOURS_OPTIONS = Array.from({ length: 49 }, (_, index) => (index / 2).toFixed(1))

export function DailyLogForm() {
  const today = new Date().toISOString().slice(0, 10)
  const { upsertDailyLog, loading: savingLog } = useDailyLogs()

  const [aiLoading, setAiLoading] = useState(false)

  const form = useForm<DailyLogFormValues>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      log_date: today,
      overall_mood: null,
      sleep_quality: null,
      sleep_hours: null,
      medication_given: false,
      medication_notes: '',
      diet_notes: '',
      general_notes: '',
      ai_formatted_summary: '',
    },
  })

  const selectedDate = form.watch('log_date') || today
  const { incidents } = useIncidents({
    startDate: `${selectedDate}T00:00:00.000Z`,
    endDate: `${selectedDate}T23:59:59.999Z`,
  })

  const dailySummaryContext = useMemo(
    () => ({
      date: selectedDate,
      incidents: incidents.map((incident) => ({
        occurred_at: incident.occurred_at,
        setting: incident.setting,
        severity: incident.severity,
        hypothesized_function: incident.hypothesized_function,
        behavior_notes: incident.behavior_notes,
        parent_raw_notes: incident.parent_raw_notes,
      })),
    }),
    [incidents, selectedDate],
  )

  const medicationGiven = form.watch('medication_given')

  const onSubmit = async (values: DailyLogFormValues) => {
    const payload = {
      log_date: values.log_date,
      overall_mood: values.overall_mood ?? null,
      sleep_quality: values.sleep_quality ?? null,
      sleep_hours: values.sleep_hours ?? null,
      medication_given: values.medication_given,
      medication_notes: values.medication_notes?.trim() || null,
      diet_notes: values.diet_notes?.trim() || null,
      general_notes: values.general_notes?.trim() || null,
      ai_formatted_summary: values.ai_formatted_summary?.trim() || null,
    }

    const { error } = await upsertDailyLog(payload)

    if (error) {
      toast.error(error.message ?? 'Unable to save daily log')
      return
    }

    toast.success('Daily log saved')
  }

  const summarizeDay = async () => {
    setAiLoading(true)
    try {
      const values = form.getValues()
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dailySummaryContext,
          daily_log: {
            overall_mood: values.overall_mood,
            sleep_quality: values.sleep_quality,
            sleep_hours: values.sleep_hours,
            medication_given: values.medication_given,
            medication_notes: values.medication_notes || null,
            diet_notes: values.diet_notes || null,
            general_notes: values.general_notes || null,
          },
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'AI summary request failed')
      }

      const body = (await response.json()) as { summary: string }
      form.setValue('ai_formatted_summary', body.summary, { shouldDirty: true })
      toast.success('AI summary generated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to generate AI summary')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Daily Log</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="log_date">Date</Label>
            <Input id="log_date" type="date" className="mt-1 h-11" {...form.register('log_date')} />
          </div>

          <div>
            <Label>Overall Mood</Label>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {MOODS.map((mood) => (
                <Button
                  key={mood.value}
                  type="button"
                  variant={form.watch('overall_mood') === mood.value ? 'default' : 'outline'}
                  className="h-12 rounded-lg text-base"
                  onClick={() => form.setValue('overall_mood', mood.value, { shouldValidate: true })}
                >
                  <span role="img" aria-label={mood.label}>{mood.value}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Sleep Quality</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SLEEP_QUALITY.map((quality) => (
                <Button
                  key={quality}
                  type="button"
                  variant={form.watch('sleep_quality') === quality ? 'default' : 'outline'}
                  className="h-11 rounded-lg text-sm"
                  onClick={() => form.setValue('sleep_quality', quality, { shouldValidate: true })}
                >
                  {quality}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="sleep_hours">Sleep Hours (0–24, 0.5 increments)</Label>
            <Input
              id="sleep_hours"
              list="sleep-hours-options"
              type="number"
              min={0}
              max={24}
              step={0.5}
              placeholder="e.g., 8"
              className="mt-1 h-11"
              value={form.watch('sleep_hours') ?? ''}
              onChange={(event) => {
                const value = event.target.value
                form.setValue('sleep_hours', value === '' ? null : Number(value), { shouldValidate: true })
              }}
            />
            <datalist id="sleep-hours-options">
              {SLEEP_HOURS_OPTIONS.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>

          <div>
            <Label>Medication Given</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={medicationGiven ? 'default' : 'outline'}
                className="h-11 rounded-lg"
                onClick={() => form.setValue('medication_given', true, { shouldValidate: true })}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={medicationGiven ? 'outline' : 'default'}
                className="h-11 rounded-lg"
                onClick={() => form.setValue('medication_given', false, { shouldValidate: true })}
              >
                No
              </Button>
            </div>
          </div>

          {medicationGiven && (
            <div>
              <Label htmlFor="medication_notes">Medication Notes</Label>
              <Textarea id="medication_notes" rows={3} className="mt-1" {...form.register('medication_notes')} />
              {form.formState.errors.medication_notes && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.medication_notes.message}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="diet_notes">Diet Notes</Label>
            <Textarea id="diet_notes" rows={3} className="mt-1" placeholder="Notable foods, skipped meals, hydration..." {...form.register('diet_notes')} />
          </div>

          <div>
            <Label htmlFor="general_notes">General Notes</Label>
            <Textarea id="general_notes" rows={4} className="mt-1" {...form.register('general_notes')} />
          </div>

          <div>
            <Label htmlFor="ai_formatted_summary">AI Day Summary</Label>
            <Textarea id="ai_formatted_summary" rows={5} className="mt-1" {...form.register('ai_formatted_summary')} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" className="h-11 sm:flex-1" onClick={summarizeDay} disabled={aiLoading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {aiLoading ? 'AI is writing…' : 'AI Summarize Day'}
            </Button>
            <Button type="submit" className="h-11 sm:flex-1" disabled={savingLog}>Save Daily Log</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
