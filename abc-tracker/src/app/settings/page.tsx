'use client'

import { useEffect, useRef, useState } from 'react'

import { AlertTriangle, Download, Plus, Trash2, Upload } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useCreateAntecedent, useAntecedents } from '@/lib/hooks/use-antecedents'
import { useBehaviors, useCreateBehavior, useDeleteBehavior, useUpdateBehavior } from '@/lib/hooks/use-behaviors'
import { useChildProfile, useUpdateChildProfile } from '@/lib/hooks/use-child-profile'
import { useCreateConsequence, useConsequences } from '@/lib/hooks/use-consequences'
import type { ConsequenceType } from '@/lib/types/database'

type AIPreferences = {
  languagePreference: 'person_first' | 'identity_first'
  detailLevel: 'concise' | 'detailed'
  includeRecommendations: boolean
}

const DEFAULT_AI_PREFERENCES: AIPreferences = {
  languagePreference: 'person_first',
  detailLevel: 'concise',
  includeRecommendations: false,
}

const CONSEQUENCE_TYPES: ConsequenceType[] = [
  'reinforcement_positive',
  'reinforcement_negative',
  'punishment_positive',
  'punishment_negative',
  'extinction',
  'redirection',
  'other',
]

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { profile, loading: profileLoading, refetch: refetchProfile } = useChildProfile()
  const { updateProfile, loading: savingProfile } = useUpdateChildProfile()

  const { behaviors, refetch: refetchBehaviors } = useBehaviors()
  const { createBehavior, loading: creatingBehavior } = useCreateBehavior()
  const { updateBehavior } = useUpdateBehavior()
  const { deleteBehavior } = useDeleteBehavior()

  const { antecedents, refetch: refetchAntecedents } = useAntecedents()
  const { createAntecedent, loading: creatingAntecedent } = useCreateAntecedent()

  const { consequences, refetch: refetchConsequences } = useConsequences()
  const { createConsequence, loading: creatingConsequence } = useCreateConsequence()

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    diagnosis_notes: '',
    therapist_name: '',
    therapist_email: '',
    bcba_name: '',
    bcba_email: '',
  })

  const [behaviorForm, setBehaviorForm] = useState({
    name: '',
    operational_definition: '',
    examples: '',
    non_examples: '',
    color: '#3B82F6',
    is_target_behavior: true,
    is_replacement_behavior: false,
  })

  const [antecedentForm, setAntecedentForm] = useState({ label: '', category: 'other' })
  const [consequenceForm, setConsequenceForm] = useState<{ label: string; type: ConsequenceType }>({
    label: '',
    type: 'other',
  })

  const [aiPreferences, setAiPreferences] = useState<AIPreferences>(DEFAULT_AI_PREFERENCES)
  const [clearConfirmation, setClearConfirmation] = useState('')

  useEffect(() => {
    if (!profile) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileForm({
      first_name: profile.first_name ?? '',
      last_name: profile.last_name ?? '',
      date_of_birth: profile.date_of_birth ?? '',
      diagnosis_notes: profile.diagnosis_notes ?? '',
      therapist_name: profile.therapist_name ?? '',
      therapist_email: profile.therapist_email ?? '',
      bcba_name: profile.bcba_name ?? '',
      bcba_email: profile.bcba_email ?? '',
    })

    const preferences = ((profile as { preferences?: unknown }).preferences ?? {}) as Partial<AIPreferences>

    setAiPreferences({
      languagePreference: preferences.languagePreference ?? DEFAULT_AI_PREFERENCES.languagePreference,
      detailLevel: preferences.detailLevel ?? DEFAULT_AI_PREFERENCES.detailLevel,
      includeRecommendations:
        preferences.includeRecommendations ?? DEFAULT_AI_PREFERENCES.includeRecommendations,
    })
  }, [profile])

  const saveProfile = async () => {
    if (!profileForm.first_name.trim()) {
      toast.error('First name is required.')
      return
    }

    const result = await updateProfile({
      id: profile?.id,
      first_name: profileForm.first_name.trim(),
      last_name: profileForm.last_name.trim() || null,
      date_of_birth: profileForm.date_of_birth || null,
      diagnosis_notes: profileForm.diagnosis_notes.trim() || null,
      therapist_name: profileForm.therapist_name.trim() || null,
      therapist_email: profileForm.therapist_email.trim() || null,
      bcba_name: profileForm.bcba_name.trim() || null,
      bcba_email: profileForm.bcba_email.trim() || null,
      preferences: aiPreferences,
    })

    if (result.error) {
      toast.error(result.error.message)
      return
    }

    toast.success('Child profile saved.')
    await refetchProfile()
  }

  const addBehavior = async () => {
    if (!behaviorForm.name.trim() || !behaviorForm.operational_definition.trim()) {
      toast.error('Behavior name and operational definition are required.')
      return
    }

    const result = await createBehavior({
      name: behaviorForm.name.trim(),
      operational_definition: behaviorForm.operational_definition.trim(),
      examples: behaviorForm.examples.trim() || null,
      non_examples: behaviorForm.non_examples.trim() || null,
      color: behaviorForm.color,
      icon: null,
      is_target_behavior: behaviorForm.is_target_behavior,
      is_replacement_behavior: behaviorForm.is_replacement_behavior,
    })

    if (result.error) {
      toast.error(result.error.message)
      return
    }

    setBehaviorForm({
      name: '',
      operational_definition: '',
      examples: '',
      non_examples: '',
      color: '#3B82F6',
      is_target_behavior: true,
      is_replacement_behavior: false,
    })

    toast.success('Behavior created.')
    await refetchBehaviors()
  }

  const toggleBehaviorFlag = async (
    id: string,
    field: 'is_target_behavior' | 'is_replacement_behavior',
    value: boolean,
  ) => {
    const result = await updateBehavior(id, { [field]: value })
    if (result.error) {
      toast.error(result.error.message)
      return
    }
    await refetchBehaviors()
  }

  const removeBehavior = async (id: string) => {
    const result = await deleteBehavior(id)
    if (result.error) {
      toast.error(result.error.message)
      return
    }

    toast.success('Behavior archived.')
    await refetchBehaviors()
  }

  const addAntecedent = async () => {
    if (!antecedentForm.label.trim()) {
      toast.error('Antecedent label is required.')
      return
    }

    const result = await createAntecedent({
      label: antecedentForm.label.trim(),
      category: antecedentForm.category.trim() || 'other',
    })

    if (result.error) {
      toast.error(result.error.message)
      return
    }

    setAntecedentForm({ label: '', category: 'other' })
    toast.success('Custom antecedent added.')
    await refetchAntecedents()
  }

  const addConsequence = async () => {
    if (!consequenceForm.label.trim()) {
      toast.error('Consequence label is required.')
      return
    }

    const result = await createConsequence({
      label: consequenceForm.label.trim(),
      type: consequenceForm.type,
    })

    if (result.error) {
      toast.error(result.error.message)
      return
    }

    setConsequenceForm({ label: '', type: 'other' })
    toast.success('Custom consequence added.')
    await refetchConsequences()
  }

  const saveAIPreferences = async () => {
    const result = await updateProfile({
      id: profile?.id,
      first_name: (profile?.first_name || profileForm.first_name || 'Child').trim(),
      last_name: profile?.last_name ?? null,
      date_of_birth: profile?.date_of_birth ?? null,
      diagnosis_notes: profile?.diagnosis_notes ?? null,
      therapist_name: profile?.therapist_name ?? null,
      therapist_email: profile?.therapist_email ?? null,
      bcba_name: profile?.bcba_name ?? null,
      bcba_email: profile?.bcba_email ?? null,
      preferences: aiPreferences,
    })

    if (result.error) {
      toast.error(result.error.message)
      return
    }

    toast.success('AI preferences saved.')
    await refetchProfile()
  }

  const exportAllData = async () => {
    const supabase = createClient()
    const tables = [
      'child_profile',
      'behavior_definitions',
      'antecedent_options',
      'consequence_options',
      'incidents',
      'incident_antecedents',
      'incident_consequences',
      'daily_logs',
      'ai_notes',
    ] as const

    const payload: Record<string, unknown[]> = {}

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*')
      if (error) {
        toast.error(`Unable to export ${table}: ${error.message}`)
        return
      }
      payload[table] = data ?? []
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = `abc-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(href)
    toast.success('Backup exported.')
  }

  const importAllData = async (file?: File) => {
    if (!file) return

    const text = await file.text()

    let parsed: Record<string, unknown[]>
    try {
      parsed = JSON.parse(text) as Record<string, unknown[]>
    } catch {
      toast.error('Invalid JSON file.')
      return
    }

    const supabase = createClient()

    const importTable = async (table: string, rows: unknown[] | undefined) => {
      if (!rows || rows.length === 0) return
      const { error } = await supabase.from(table).upsert(rows)
      if (error) throw new Error(`${table}: ${error.message}`)
    }

    try {
      await importTable('child_profile', parsed.child_profile)
      await importTable('behavior_definitions', parsed.behavior_definitions)
      await importTable('antecedent_options', parsed.antecedent_options)
      await importTable('consequence_options', parsed.consequence_options)
      await importTable('incidents', parsed.incidents)
      await importTable('incident_antecedents', parsed.incident_antecedents)
      await importTable('incident_consequences', parsed.incident_consequences)
      await importTable('daily_logs', parsed.daily_logs)
      await importTable('ai_notes', parsed.ai_notes)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed.')
      return
    }

    toast.success('Backup imported.')
    await Promise.all([
      refetchProfile(),
      refetchBehaviors(),
      refetchAntecedents(),
      refetchConsequences(),
    ])
  }

  const clearAllData = async () => {
    if (clearConfirmation !== 'DELETE') {
      toast.error('Type DELETE to confirm.')
      return
    }

    const supabase = createClient()

    const operations = [
      supabase.from('ai_notes').delete().neq('id', ''),
      supabase.from('incident_antecedents').delete().neq('id', ''),
      supabase.from('incident_consequences').delete().neq('id', ''),
      supabase.from('incidents').delete().neq('id', ''),
      supabase.from('daily_logs').delete().neq('id', ''),
      supabase.from('behavior_definitions').delete().neq('id', ''),
      supabase.from('antecedent_options').delete().neq('id', ''),
      supabase.from('consequence_options').delete().neq('id', ''),
      supabase.from('child_profile').delete().neq('id', ''),
    ]

    for (const operation of operations) {
      const { error } = await operation
      if (error) {
        toast.error(`Data clear failed: ${error.message}`)
        return
      }
    }

    setClearConfirmation('')
    toast.success('All app data cleared.')

    await Promise.all([
      refetchProfile(),
      refetchBehaviors(),
      refetchAntecedents(),
      refetchConsequences(),
    ])
  }

  const customAntecedents = antecedents.filter((item) => item.is_custom)
  const customConsequences = consequences.filter((item) => item.is_custom)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 pb-28 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">
          Manage child profile, behavior library, custom ABC options, AI preferences, and data tools.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Child profile</CardTitle>
          <CardDescription>Provider-facing child and care team details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first-name">First name</Label>
            <Input
              id="first-name"
              value={profileForm.first_name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, first_name: event.target.value }))}
              placeholder="Child first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Last name</Label>
            <Input
              id="last-name"
              value={profileForm.last_name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, last_name: event.target.value }))}
              placeholder="Child last name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={profileForm.date_of_birth}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, date_of_birth: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis notes</Label>
            <Input
              id="diagnosis"
              value={profileForm.diagnosis_notes}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  diagnosis_notes: event.target.value,
                }))
              }
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="therapist-name">Therapist name</Label>
            <Input
              id="therapist-name"
              value={profileForm.therapist_name}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  therapist_name: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="therapist-email">Therapist email</Label>
            <Input
              id="therapist-email"
              type="email"
              value={profileForm.therapist_email}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  therapist_email: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcba-name">BCBA name</Label>
            <Input
              id="bcba-name"
              value={profileForm.bcba_name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, bcba_name: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcba-email">BCBA email</Label>
            <Input
              id="bcba-email"
              type="email"
              value={profileForm.bcba_email}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  bcba_email: event.target.value,
                }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={saveProfile} disabled={savingProfile || profileLoading}>
              {savingProfile ? 'Saving...' : 'Save profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Behavior library</CardTitle>
          <CardDescription>Add and maintain target/replacement behaviors used in incident logging.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={behaviorForm.name}
              onChange={(event) => setBehaviorForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Behavior name"
            />
            <Input
              value={behaviorForm.color}
              onChange={(event) => setBehaviorForm((prev) => ({ ...prev, color: event.target.value }))}
              placeholder="#3B82F6"
            />
            <Textarea
              className="md:col-span-2"
              value={behaviorForm.operational_definition}
              onChange={(event) =>
                setBehaviorForm((prev) => ({
                  ...prev,
                  operational_definition: event.target.value,
                }))
              }
              placeholder="Operational definition"
            />
            <Input
              value={behaviorForm.examples}
              onChange={(event) => setBehaviorForm((prev) => ({ ...prev, examples: event.target.value }))}
              placeholder="Examples"
            />
            <Input
              value={behaviorForm.non_examples}
              onChange={(event) => setBehaviorForm((prev) => ({ ...prev, non_examples: event.target.value }))}
              placeholder="Non-examples"
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={behaviorForm.is_target_behavior}
                onCheckedChange={(checked) =>
                  setBehaviorForm((prev) => ({
                    ...prev,
                    is_target_behavior: Boolean(checked),
                  }))
                }
                id="is-target"
              />
              <Label htmlFor="is-target">Target behavior</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={behaviorForm.is_replacement_behavior}
                onCheckedChange={(checked) =>
                  setBehaviorForm((prev) => ({
                    ...prev,
                    is_replacement_behavior: Boolean(checked),
                  }))
                }
                id="is-replacement"
              />
              <Label htmlFor="is-replacement">Replacement behavior</Label>
            </div>
            <Button onClick={addBehavior} disabled={creatingBehavior} className="gap-2">
              <Plus className="size-4" />
              Add behavior
            </Button>
          </div>

          <Separator />

          <ScrollArea className="max-h-80">
            <div className="space-y-3 pr-3">
              {behaviors.map((behavior) => (
                <div key={behavior.id} className="rounded-xl border bg-white p-3 shadow-sm">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex size-3 rounded-full" style={{ backgroundColor: behavior.color }} />
                      <p className="font-medium">{behavior.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => void removeBehavior(behavior.id)}>
                      <Trash2 className="size-4 text-rose-500" />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">{behavior.operational_definition}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={behavior.is_target_behavior}
                        onCheckedChange={(value) => void toggleBehaviorFlag(behavior.id, 'is_target_behavior', value)}
                      />
                      Target
                    </label>
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={behavior.is_replacement_behavior}
                        onCheckedChange={(value) =>
                          void toggleBehaviorFlag(behavior.id, 'is_replacement_behavior', value)
                        }
                      />
                      Replacement
                    </label>
                  </div>
                </div>
              ))}
              {behaviors.length === 0 && <p className="text-sm text-slate-500">No behaviors yet.</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom antecedents & consequences</CardTitle>
          <CardDescription>Custom options appear directly in the incident form selection lists.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border p-4">
            <h3 className="font-medium">Add antecedent</h3>
            <Input
              value={antecedentForm.label}
              onChange={(event) => setAntecedentForm((prev) => ({ ...prev, label: event.target.value }))}
              placeholder="Antecedent label"
            />
            <Input
              value={antecedentForm.category}
              onChange={(event) => setAntecedentForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Category"
            />
            <Button onClick={addAntecedent} disabled={creatingAntecedent}>
              Add antecedent
            </Button>
            <div className="flex flex-wrap gap-2">
              {customAntecedents.map((item) => (
                <Badge key={item.id} variant="secondary">
                  {item.label}
                </Badge>
              ))}
              {customAntecedents.length === 0 && <p className="text-sm text-slate-500">No custom antecedents.</p>}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            <h3 className="font-medium">Add consequence</h3>
            <Input
              value={consequenceForm.label}
              onChange={(event) => setConsequenceForm((prev) => ({ ...prev, label: event.target.value }))}
              placeholder="Consequence label"
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={consequenceForm.type}
              onChange={(event) =>
                setConsequenceForm((prev) => ({
                  ...prev,
                  type: event.target.value as ConsequenceType,
                }))
              }
            >
              {CONSEQUENCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Button onClick={addConsequence} disabled={creatingConsequence}>
              Add consequence
            </Button>
            <div className="flex flex-wrap gap-2">
              {customConsequences.map((item) => (
                <Badge key={item.id} variant="secondary">
                  {item.label}
                </Badge>
              ))}
              {customConsequences.length === 0 && <p className="text-sm text-slate-500">No custom consequences.</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI preferences</CardTitle>
          <CardDescription>Control language style and AI note detail level.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Language preference</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={aiPreferences.languagePreference}
                onChange={(event) =>
                  setAiPreferences((prev) => ({
                    ...prev,
                    languagePreference: event.target.value as AIPreferences['languagePreference'],
                  }))
                }
              >
                <option value="person_first">Person-first</option>
                <option value="identity_first">Identity-first</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Detail level</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={aiPreferences.detailLevel}
                onChange={(event) =>
                  setAiPreferences((prev) => ({
                    ...prev,
                    detailLevel: event.target.value as AIPreferences['detailLevel'],
                  }))
                }
              >
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl border p-3">
            <span className="text-sm">Include AI recommendations (off by default)</span>
            <Switch
              checked={aiPreferences.includeRecommendations}
              onCheckedChange={(value) =>
                setAiPreferences((prev) => ({
                  ...prev,
                  includeRecommendations: value,
                }))
              }
            />
          </label>

          <Button onClick={saveAIPreferences}>Save AI preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data management</CardTitle>
          <CardDescription>Backup, restore, or clear all app data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="gap-2" onClick={exportAllData}>
              <Download className="size-4" /> Export JSON backup
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" /> Import JSON backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => void importAllData(event.target.files?.[0])}
            />
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
            <p className="mb-1 flex items-center gap-2 font-medium">
              <AlertTriangle className="size-4" /> Danger zone
            </p>
            <p className="text-sm">Clearing data will permanently remove incidents, daily logs, and setup data.</p>
          </div>

          <div className="flex flex-col gap-2 md:max-w-sm">
            <Label htmlFor="confirm-delete">Type DELETE to unlock clear action</Label>
            <Input
              id="confirm-delete"
              value={clearConfirmation}
              onChange={(event) => setClearConfirmation(event.target.value)}
              placeholder="DELETE"
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2" disabled={clearConfirmation !== 'DELETE'}>
                <Trash2 className="size-4" /> Clear all data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all ABC tracker data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void clearAllData()}>Yes, clear everything</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
