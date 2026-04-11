'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
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
import { useCreateIncident, useIncident, useUpdateIncident } from '@/lib/hooks/use-incidents'
import { createClient } from '@/lib/supabase/client'
import { incidentFormSchema, type IncidentFormValues } from '@/lib/types/schemas'
import type { BehaviorFunction, ConsequenceType, IncidentSetting } from '@/lib/types/database'

const STEPS = ['When & Where', 'Antecedent', 'Behavior', 'Consequence', 'Context & Notes', 'Review']
const DRAFT_KEY = 'abc-incident-draft-v1'
const DEFAULT_ANTECEDENT_PREFIX = 'default-antecedent:'
const DEFAULT_CONSEQUENCE_PREFIX = 'default-consequence:'

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
  const searchParams = useSearchParams()
  const editingIncidentId = searchParams.get('incidentId')
  const isEditing = Boolean(editingIncidentId)

  const [step, setStep] = useState(0)
  const [peopleInput, setPeopleInput] = useState('')
  const [environmentInput, setEnvironmentInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [lastAIRequestAt, setLastAIRequestAt] = useState(0)

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: initialValues,
  })

  const watchedBehaviorId = useWatch({ control: form.control, name: 'behavior_id' })
  const watchedAntecedentIds = useWatch({ control: form.control, name: 'antecedent_ids' }) ?? []
  const watchedConsequenceIds = useWatch({ control: form.control, name: 'consequence_ids' }) ?? []

  const { behaviors } = useBehaviors()
  const { antecedents, refetch: refetchAntecedents } = useAntecedents()
  const { consequences, refetch: refetchConsequences } = useConsequences()
  const { createIncident, loading: creating } = useCreateIncident()
  const { updateIncident, loading: updating } = useUpdateIncident()
  const { incident: editingIncident, loading: loadingEditIncident } = useIncident(editingIncidentId ?? undefined)
  const { createAntecedent } = useCreateAntecedent()
  const { createConsequence } = useCreateConsequence()
  const saving = creating || updating

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


  useEffect(() => {
    if (!isEditing || !editingIncident) return

    const occurredAtLocal = new Date(new Date(editingIncident.occurred_at).getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)

    form.reset({
      occurred_at: occurredAtLocal,
      setting: editingIncident.setting,
      setting_detail: editingIncident.setting_detail ?? '',
      duration_minutes: editingIncident.duration_seconds ? Math.floor(editingIncident.duration_seconds / 60) : 0,
      duration_seconds_only: editingIncident.duration_seconds ? editingIncident.duration_seconds % 60 : 0,
      antecedent_ids: editingIncident.antecedent_ids ?? [],
      antecedent_notes: editingIncident.antecedent_notes ?? '',
      behavior_id: editingIncident.behavior_id,
      behavior_notes: editingIncident.behavior_notes ?? '',
      severity: editingIncident.severity,
      consequence_ids: editingIncident.consequence_ids ?? [],
      consequence_notes: editingIncident.consequence_notes ?? '',
      hypothesized_function: editingIncident.hypothesized_function,
      people_present: editingIncident.people_present
        ? editingIncident.people_present.split(',').map((value) => value.trim()).filter(Boolean)
        : [],
      environmental_factors: editingIncident.environmental_factors
        ? editingIncident.environmental_factors.split(',').map((value) => value.trim()).filter(Boolean)
        : [],
      mood_before: editingIncident.mood_before ?? undefined,
      parent_raw_notes: editingIncident.parent_raw_notes ?? '',
      ai_formatted_notes: editingIncident.ai_formatted_notes ?? '',
    })
  }, [editingIncident, form, isEditing])

  const selectedBehavior = useMemo(
    () => behaviors.find((behavior) => behavior.id === watchedBehaviorId),
    [behaviors, watchedBehaviorId],
  )

  const antecedentOptions = useMemo(() => {
    const existingLabels = new Set(antecedents.map((item) => item.label.toLowerCase()))
    const defaultOnly = DEFAULT_ANTECEDENTS.filter((item) => !existingLabels.has(item.label.toLowerCase())).map((item) => ({
      id: `${DEFAULT_ANTECEDENT_PREFIX}${item.label}`,
      label: item.label,
      category: item.category,
      is_custom: false,
      created_at: '',
    }))
    return [...antecedents, ...defaultOnly]
  }, [antecedents])

  const consequenceOptions = useMemo(() => {
    const existingLabels = new Set(consequences.map((item) => item.label.toLowerCase()))
    const defaultOnly = DEFAULT_CONSEQUENCES.filter((item) => !existingLabels.has(item.label.toLowerCase())).map((item) => ({
      id: `${DEFAULT_CONSEQUENCE_PREFIX}${item.label}`,
      label: item.label,
      type: item.type as ConsequenceType,
      is_custom: false,
      created_at: '',
    }))
    return [...consequences, ...defaultOnly]
  }, [consequences])

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

    const normalizeAntecedentIds = async (selectedIds: string[]) => {
      const knownById = new Map(antecedents.map((item) => [item.id, item]))
      const knownByLabel = new Map(antecedents.map((item) => [item.label.toLowerCase(), item.id]))
      const resolved = new Set<string>()

      for (const selectedId of selectedIds) {
        if (knownById.has(selectedId)) {
          resolved.add(selectedId)
          continue
        }

        const normalizedLabel = selectedId.startsWith(DEFAULT_ANTECEDENT_PREFIX)
          ? selectedId.slice(DEFAULT_ANTECEDENT_PREFIX.length)
          : selectedId

        const existingId = knownByLabel.get(normalizedLabel.toLowerCase())
        if (existingId) {
          resolved.add(existingId)
          continue
        }

        const defaultOption = DEFAULT_ANTECEDENTS.find((item) => item.label.toLowerCase() === normalizedLabel.toLowerCase())
        if (!defaultOption) {
          continue
        }

        const { data, error } = await createAntecedent({
          label: defaultOption.label,
          category: defaultOption.category,
        })

        if (error || !data) {
          throw new Error(error?.message ?? `Unable to create antecedent: ${defaultOption.label}`)
        }

        resolved.add(data.id)
      }

      return [...resolved]
    }

    const normalizeConsequenceIds = async (selectedIds: string[]) => {
      const knownById = new Map(consequences.map((item) => [item.id, item]))
      const knownByLabel = new Map(consequences.map((item) => [item.label.toLowerCase(), item.id]))
      const resolved = new Set<string>()

      for (const selectedId of selectedIds) {
        if (knownById.has(selectedId)) {
          resolved.add(selectedId)
          continue
        }

        const normalizedLabel = selectedId.startsWith(DEFAULT_CONSEQUENCE_PREFIX)
          ? selectedId.slice(DEFAULT_CONSEQUENCE_PREFIX.length)
          : selectedId

        const existingId = knownByLabel.get(normalizedLabel.toLowerCase())
        if (existingId) {
          resolved.add(existingId)
          continue
        }

        const defaultOption = DEFAULT_CONSEQUENCES.find((item) => item.label.toLowerCase() === normalizedLabel.toLowerCase())
        if (!defaultOption) {
          continue
        }

        const { data, error } = await createConsequence({
          label: defaultOption.label,
          type: defaultOption.type as ConsequenceType,
        })

        if (error || !data) {
          throw new Error(error?.message ?? `Unable to create consequence: ${defaultOption.label}`)
        }

        resolved.add(data.id)
      }

      return [...resolved]
    }

    let normalizedAntecedentIds: string[]
    let normalizedConsequenceIds: string[]

    try {
      normalizedAntecedentIds = await normalizeAntecedentIds(values.antecedent_ids)
      normalizedConsequenceIds = await normalizeConsequenceIds(values.consequence_ids)
    } catch (normalizationError) {
      toast.error(normalizationError instanceof Error ? normalizationError.message : 'Unable to save incident options.')
      return
    }

    const durationMinutes = Number(values.duration_minutes ?? 0)
    const durationSecondsOnly = Number(values.duration_seconds_only ?? 0)
    const durationSeconds = durationMinutes * 60 + durationSecondsOnly

    const payload = {
      occurred_at: new Date(values.occurred_at).toISOString(),
      duration_seconds: durationSeconds > 0 ? durationSeconds : null,
      setting: values.setting as IncidentSetting,
      setting_detail: values.setting_detail || null,
      antecedent_ids: normalizedAntecedentIds,
      antecedent_notes: values.antecedent_notes || null,
      behavior_id: values.behavior_id,
      behavior_notes: values.behavior_notes || null,
      severity: values.severity,
      consequence_ids: normalizedConsequenceIds,
      consequence_notes: values.consequence_notes || null,
      hypothesized_function: values.hypothesized_function as BehaviorFunction,
      parent_raw_notes: values.parent_raw_notes || null,
      ai_formatted_notes: values.ai_formatted_notes || null,
      people_present: values.people_present?.length ? values.people_present.join(', ') : null,
      environmental_factors: values.environmental_factors?.length ? values.environmental_factors.join(', ') : null,
      mood_before: values.mood_before || null,
    }

    const result = isEditing && editingIncidentId
      ? await updateIncident(editingIncidentId, payload)
      : await createIncident(payload)

    if (result.error) {
      toast.error(result.error.message ?? `Unable to ${isEditing ? 'update' : 'save'} incident.`)
      return
    }

    if (normalizedAntecedentIds.length !== values.antecedent_ids.length) {
      form.setValue('antecedent_ids', normalizedAntecedentIds, { shouldDirty: true })
    }

    if (normalizedConsequenceIds.length !== values.consequence_ids.length) {
      form.setValue('consequence_ids', normalizedConsequenceIds, { shouldDirty: true })
    }

    toast.success(isEditing ? 'Incident updated successfully.' : 'Incident saved successfully.')
    await Promise.all([refetchAntecedents(), refetchConsequences()])
    localStorage.removeItem(DRAFT_KEY)

    if (resetAfterSave) {
      form.reset(initialValues)
      setStep(0)
      return
    }

    if (!isEditing) {
      setStep(STEPS.length - 1)
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
          antecedents: antecedentOptions
            .filter((item) => values.antecedent_ids.includes(item.id))
            .map((item) => item.label),
          behavior: selectedBehavior?.name,
          consequences: consequenceOptions
            .filter((item) => values.consequence_ids.includes(item.id))
            .map((item) => item.label),
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
        <CardTitle className="text-xl">{isEditing ? 'Edit Incident' : 'Log Incident'}</CardTitle>
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
        {isEditing ? <p className="text-xs text-blue-700">Editing existing incident details. Update fields and save your corrections.</p> : null}
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
              {antecedentOptions.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={watchedAntecedentIds.includes(item.id) ? 'default' : 'outline'}
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
                  variant={watchedBehaviorId === behavior.id ? 'default' : 'outline'}
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
              {consequenceOptions.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={watchedConsequenceIds.includes(item.id) ? 'default' : 'outline'}
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
              <Button className="h-12 flex-1" onClick={() => void form.handleSubmit(() => saveIncident(false))()} disabled={saving || (isEditing && loadingEditIncident)}>
                {isEditing ? 'Update Incident' : 'Save Incident'}
              </Button>
              <Button
                className="h-12 flex-1"
                variant="outline"
                onClick={() => void form.handleSubmit(() => saveIncident(true))()}
                disabled={saving || isEditing || (isEditing && loadingEditIncident)}
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
