'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  BEHAVIOR_FUNCTIONS,
  DEFAULT_ANTECEDENTS,
  DEFAULT_CONSEQUENCES,
  MOOD_OPTIONS,
  SETTINGS,
  SEVERITY_LEVELS,
} from '@/lib/constants/abc-options'
import { useCreateAntecedent, useAntecedents } from '@/lib/hooks/use-antecedents'
import { useBehaviors } from '@/lib/hooks/use-behaviors'
import { useCreateConsequence, useConsequences } from '@/lib/hooks/use-consequences'
import { useCreateIncident } from '@/lib/hooks/use-incidents'
import { createClient } from '@/lib/supabase/client'
import { incidentFormSchema, type IncidentFormValues } from '@/lib/types/schemas'
import type { BehaviorFunction, ConsequenceType, IncidentSetting } from '@/lib/types/database'

const STEPS = ['When & Where', 'Antecedent', 'Behavior', 'Consequence', 'Context & Notes', 'Review']
const DRAFT_KEY = 'abc-incident-draft-v1'

const initialValues: IncidentFormValues = {
  occurred_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  setting: 'home',
  setting_detail: '',
  duration_minutes: 0,
  duration_seconds_only: 0,
  antecedent_ids: [],
  antecedent_notes: '',
  behavior_id: '',
  behavior_notes: '',
  severity: 'medium',
  consequence_ids: [],
  consequence_notes: '',
  hypothesized_function: 'unknown',
  people_present: [],
  environmental_factors: [],
  mood_before: undefined,
  parent_raw_notes: '',
  ai_formatted_notes: '',
}

export function IncidentForm() {
  const [step, setStep] = useState(0)
  const [peopleInput, setPeopleInput] = useState('')
  const [environmentInput, setEnvironmentInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [lastAIRequestAt, setLastAIRequestAt] = useState(0)

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: initialValues,
  })

  const { behaviors } = useBehaviors()
  const { antecedents, refetch: refetchAntecedents } = useAntecedents()
  const { consequences, refetch: refetchConsequences } = useConsequences()
  const { createIncident, loading: saving } = useCreateIncident()
  const { createAntecedent } = useCreateAntecedent()
  const { createConsequence } = useCreateConsequence()

  useEffect(() => {
    const rawDraft = localStorage.getItem(DRAFT_KEY)
    if (!rawDraft) return
    try {
      const parsed = incidentFormSchema.partial().parse(JSON.parse(rawDraft))
      form.reset({ ...initialValues, ...parsed })
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [form])

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(value))
    })
    return () => subscription.unsubscribe()
  }, [form])

  const selectedBehavior = useMemo(
    () => behaviors.find((behavior) => behavior.id === form.watch('behavior_id')),
    [behaviors, form],
  )

  const nextStep = async () => {
    const stepFields: Record<number, (keyof IncidentFormValues)[]> = {
      0: ['occurred_at', 'setting', 'duration_minutes', 'duration_seconds_only'],
      1: ['antecedent_ids', 'antecedent_notes'],
      2: ['behavior_id', 'severity', 'behavior_notes'],
      3: ['consequence_ids', 'consequence_notes'],
      4: ['hypothesized_function', 'parent_raw_notes'],
      5: [],
    }

    const valid = await form.trigger(stepFields[step] ?? [])
    if (!valid) return
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const saveIncident = async (resetAfterSave = false) => {
    const values = form.getValues()
    const durationMinutes = Number(values.duration_minutes ?? 0)
    const durationSecondsOnly = Number(values.duration_seconds_only ?? 0)
    const durationSeconds = durationMinutes * 60 + durationSecondsOnly

    const payload = {
      occurred_at: new Date(values.occurred_at).toISOString(),
      duration_seconds: durationSeconds > 0 ? durationSeconds : null,
      setting: values.setting as IncidentSetting,
      setting_detail: values.setting_detail || null,
      antecedent_ids: values.antecedent_ids,
      antecedent_notes: values.antecedent_notes || null,
      behavior_id: values.behavior_id,
      behavior_notes: values.behavior_notes || null,
      severity: values.severity,
      consequence_ids: values.consequence_ids,
      consequence_notes: values.consequence_notes || null,
      hypothesized_function: values.hypothesized_function as BehaviorFunction,
      parent_raw_notes: values.parent_raw_notes || null,
      ai_formatted_notes: values.ai_formatted_notes || null,
      people_present: values.people_present?.length ? values.people_present.join(', ') : null,
      environmental_factors: values.environmental_factors?.length ? values.environmental_factors.join(', ') : null,
      mood_before: values.mood_before || null,
    }

    const { error } = await createIncident(payload)
    if (error) {
      toast.error(error.message ?? 'Unable to save incident.')
      return
    }

    toast.success('Incident saved successfully.')
    localStorage.removeItem(DRAFT_KEY)

    if (resetAfterSave) {
      form.reset(initialValues)
      setStep(0)
      return
    }
  }

  const handleAddTag = (field: 'people_present' | 'environmental_factors', value: string) => {
    const cleaned = value.trim()
    if (!cleaned) return
    const existing = form.getValues(field) ?? []
    if (existing.includes(cleaned)) return
    form.setValue(field, [...existing, cleaned], { shouldValidate: true, shouldDirty: true })
  }

  const toggleSelection = (field: 'antecedent_ids' | 'consequence_ids', id: string) => {
    const values = form.getValues(field)
    if (values.includes(id)) {
      form.setValue(
        field,
        values.filter((value) => value !== id),
        { shouldValidate: true, shouldDirty: true },
      )
      return
    }
    form.setValue(field, [...values, id], { shouldValidate: true, shouldDirty: true })
  }

  const handleAIGenerate = async () => {
    if (Date.now() - lastAIRequestAt < 1200) return

    setAiLoading(true)
    setLastAIRequestAt(Date.now())
    const values = form.getValues()
    try {
      const response = await fetch('/api/ai/format-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          antecedents: antecedents.filter((item) => values.antecedent_ids.includes(item.id)).map((item) => item.label),
          behavior: selectedBehavior?.name,
          consequences: consequences.filter((item) => values.consequence_ids.includes(item.id)).map((item) => item.label),
          severity: values.severity,
          setting: values.setting as IncidentSetting,
          parent_raw_notes: values.parent_raw_notes,
        }),
      })

      if (!response.ok) throw new Error('AI service unavailable right now')

      const result = (await response.json()) as { formatted_note?: string; suggested_function?: IncidentFormValues['hypothesized_function']; error?: string }
      const note = result.formatted_note
      if (!note) throw new Error('AI did not return a note')

      form.setValue('ai_formatted_notes', note, { shouldDirty: true })
      if (result.suggested_function) {
        form.setValue('hypothesized_function', result.suggested_function)
      }

      const supabase = createClient()
      await supabase.from('ai_notes').insert({
        incident_id: null,
        daily_log_id: null,
        note_type: 'incident',
        raw_input: values.parent_raw_notes || JSON.stringify(values),
        formatted_output: note,
      })
      toast.success('AI note generated.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to generate AI note')
    } finally {
      setAiLoading(false)
    }
  }

  const addCustomAntecedent = async () => {
    const label = prompt('Add custom antecedent')
    if (!label) return
    const { data, error } = await createAntecedent({ label, category: 'custom' })
    if (error || !data) {
      toast.error(error?.message ?? 'Unable to create antecedent')
      return
    }
    await refetchAntecedents()
    toggleSelection('antecedent_ids', data.id)
  }

  const addCustomConsequence = async () => {
    const label = prompt('Add custom consequence')
    if (!label) return
    const { data, error } = await createConsequence({ label, type: 'other' as ConsequenceType })
    if (error || !data) {
      toast.error(error?.message ?? 'Unable to create consequence')
      return
    }
    await refetchConsequences()
    toggleSelection('consequence_ids', data.id)
  }

  return (
    <Card className="mx-auto max-w-4xl rounded-2xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Log Incident</CardTitle>
        <div className="flex items-center gap-2">
          {STEPS.map((label, index) => (
            <button
              key={label}
              className={`h-2.5 flex-1 rounded-full transition ${index <= step ? 'bg-blue-500' : 'bg-slate-200'}`}
              onClick={() => setStep(index)}
              type="button"
              aria-label={`Go to ${label}`}
            />
          ))}
        </div>
        <p className="text-sm text-slate-600">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label>Date & Time</Label>
              <Input type="datetime-local" {...form.register('occurred_at')} className="h-12" />
            </div>
            <div className="grid gap-2 md:grid-cols-5">
              {SETTINGS.map((setting) => (
                <Button
                  key={setting.value}
                  type="button"
                  variant={form.watch('setting') === setting.value ? 'default' : 'outline'}
                  className="h-12"
                  onClick={() => form.setValue('setting', setting.value)}
                >
                  {setting.label}
                </Button>
              ))}
            </div>
            <Input placeholder="Setting detail (optional)" className="h-12" {...form.register('setting_detail')} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Minutes</Label>
                <Input type="number" className="h-12" {...form.register('duration_minutes')} />
              </div>
              <div>
                <Label>Seconds</Label>
                <Input type="number" className="h-12" {...form.register('duration_seconds_only')} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">What was happening right before the behavior?</p>
            <div className="flex flex-wrap gap-2">
              {[...antecedents, ...DEFAULT_ANTECEDENTS.map((item) => ({ ...item, id: item.label, is_custom: false, created_at: '' }))].map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={form.watch('antecedent_ids').includes(item.id) ? 'default' : 'outline'}
                  className="h-11"
                  onClick={() => toggleSelection('antecedent_ids', item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Button type="button" variant="secondary" onClick={addCustomAntecedent}>Add Custom</Button>
            <Textarea rows={4} placeholder="Describe what was happening before the behavior." {...form.register('antecedent_notes')} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">What did your child do?</p>
            <div className="grid gap-2">
              {behaviors.map((behavior) => (
                <Button
                  key={behavior.id}
                  type="button"
                  variant={form.watch('behavior_id') === behavior.id ? 'default' : 'outline'}
                  className="h-12 justify-start"
                  onClick={() => form.setValue('behavior_id', behavior.id, { shouldValidate: true })}
                >
                  {behavior.name}
                </Button>
              ))}
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              {SEVERITY_LEVELS.map((level) => (
                <Button
                  key={level.value}
                  type="button"
                  className="h-12"
                  variant={form.watch('severity') === level.value ? 'default' : 'outline'}
                  onClick={() => form.setValue('severity', level.value)}
                >
                  {level.label}
                </Button>
              ))}
            </div>
            <Textarea rows={4} placeholder="Describe exactly what you observed." {...form.register('behavior_notes')} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">How did you and others respond?</p>
            <div className="flex flex-wrap gap-2">
              {[
                ...consequences,
                ...DEFAULT_CONSEQUENCES.map((item) => ({ ...item, id: item.label, is_custom: false, created_at: '' })),
              ].map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={form.watch('consequence_ids').includes(item.id) ? 'default' : 'outline'}
                  className="h-11"
                  onClick={() => toggleSelection('consequence_ids', item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Button type="button" variant="secondary" onClick={addCustomConsequence}>Add Custom</Button>
            <Textarea rows={4} placeholder="Describe what happened after the behavior." {...form.register('consequence_notes')} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2">
              {BEHAVIOR_FUNCTIONS.map((fn) => (
                <Button
                  key={fn.value}
                  type="button"
                  variant={form.watch('hypothesized_function') === fn.value ? 'default' : 'outline'}
                  className="h-auto min-h-16 justify-start p-3 text-left"
                  onClick={() => form.setValue('hypothesized_function', fn.value)}
                >
                  <div>
                    <p>{fn.label}</p>
                    <p className="text-xs opacity-75">{fn.description}</p>
                  </div>
                </Button>
              ))}
            </div>

            <div>
              <Label>People present</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={peopleInput}
                  onChange={(event) => setPeopleInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddTag('people_present', peopleInput)
                      setPeopleInput('')
                    }
                  }}
                  placeholder="Type a name and press Enter"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleAddTag('people_present', peopleInput)
                    setPeopleInput('')
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(form.watch('people_present') ?? []).map((person) => (
                  <Badge key={person} className="cursor-pointer" onClick={() => form.setValue('people_present', (form.watch('people_present') ?? []).filter((value) => value !== person))}>
                    {person} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Environmental factors</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={environmentInput}
                  onChange={(event) => setEnvironmentInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddTag('environmental_factors', environmentInput)
                      setEnvironmentInput('')
                    }
                  }}
                  placeholder="Type a factor and press Enter"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleAddTag('environmental_factors', environmentInput)
                    setEnvironmentInput('')
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(form.watch('environmental_factors') ?? []).map((item) => (
                  <Badge key={item} className="cursor-pointer" onClick={() => form.setValue('environmental_factors', (form.watch('environmental_factors') ?? []).filter((value) => value !== item))}>
                    {item} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <Button
                  key={mood}
                  type="button"
                  variant={form.watch('mood_before') === mood ? 'default' : 'outline'}
                  className="h-11"
                  onClick={() => form.setValue('mood_before', mood)}
                >
                  {mood}
                </Button>
              ))}
            </div>

            <Textarea rows={5} placeholder="Any additional observations or notes?" {...form.register('parent_raw_notes')} />
            <Button type="button" className="h-12 gap-2" onClick={handleAIGenerate} disabled={aiLoading}>
              <Sparkles className="size-4" />
              {aiLoading ? 'AI is writing...' : 'AI Format'}
            </Button>

            {form.watch('ai_formatted_notes') ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Formatted Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea rows={6} {...form.register('ai_formatted_notes')} />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleAIGenerate}>Regenerate</Button>
                    <Button type="button" onClick={() => toast.success('AI note accepted')}>Accept</Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Review your entry before saving.</p>
            <Card className="bg-slate-50">
              <CardContent className="space-y-2 pt-6 text-sm">
                <p><strong>When:</strong> {form.watch('occurred_at')}</p>
                <p><strong>Where:</strong> {form.watch('setting')} {form.watch('setting_detail')}</p>
                <p><strong>Behavior:</strong> {selectedBehavior?.name ?? '—'} ({form.watch('severity')})</p>
                <p><strong>Antecedents:</strong> {form.watch('antecedent_ids').length}</p>
                <p><strong>Consequences:</strong> {form.watch('consequence_ids').length}</p>
                <p><strong>Function:</strong> {form.watch('hypothesized_function')}</p>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="h-12 flex-1" onClick={() => void form.handleSubmit(() => saveIncident(false))()} disabled={saving}>
                Save Incident
              </Button>
              <Button
                className="h-12 flex-1"
                variant="outline"
                onClick={() => void form.handleSubmit(() => saveIncident(true))()}
                disabled={saving}
              >
                Save & Log Another
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" className="h-12" disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))}>
            Back
          </Button>
          <Button type="button" className="h-12" onClick={() => void nextStep()} disabled={step === STEPS.length - 1}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
