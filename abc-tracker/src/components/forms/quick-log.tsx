'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SEVERITY_LEVELS, SETTINGS } from '@/lib/constants/abc-options'
import { useBehaviors } from '@/lib/hooks/use-behaviors'
import { useCreateIncident } from '@/lib/hooks/use-incidents'
import { quickLogSchema, type QuickLogValues } from '@/lib/types/schemas'

export function QuickLog() {
  const { behaviors } = useBehaviors()
  const { createIncident, loading } = useCreateIncident()

  const form = useForm<QuickLogValues>({
    resolver: zodResolver(quickLogSchema),
    defaultValues: {
      occurred_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      behavior_id: '',
      severity: 'medium',
      setting: 'home',
      parent_raw_notes: '',
    },
  })

  const onSubmit = async (values: QuickLogValues) => {
    const payload = {
      occurred_at: new Date(values.occurred_at).toISOString(),
      duration_seconds: null,
      setting: values.setting,
      setting_detail: null,
      antecedent_ids: [],
      antecedent_notes: null,
      behavior_id: values.behavior_id,
      behavior_notes: null,
      severity: values.severity,
      consequence_ids: [],
      consequence_notes: null,
      hypothesized_function: 'unknown' as const,
      parent_raw_notes: values.parent_raw_notes || null,
      ai_formatted_notes: null,
      people_present: null,
      environmental_factors: null,
      mood_before: null,
    }

    const { error } = await createIncident(payload)
    if (error) {
      toast.error(error.message ?? 'Unable to save quick log')
      return
    }

    toast.success('Quick log saved')
    form.reset({ ...form.getValues(), parent_raw_notes: '' })
  }

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Quick Log</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <Label>Date & Time</Label>
            <Input type="datetime-local" className="h-11" {...form.register('occurred_at')} />
          </div>
          <div>
            <Label>Behavior</Label>
            <Select value={form.watch('behavior_id')} onValueChange={(value) => form.setValue('behavior_id', value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select behavior" />
              </SelectTrigger>
              <SelectContent>
                {behaviors.map((behavior) => (
                  <SelectItem key={behavior.id} value={behavior.id}>{behavior.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Severity</Label>
              <Select value={form.watch('severity')} onValueChange={(value) => form.setValue('severity', value as QuickLogValues['severity'])}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Setting</Label>
              <Select value={form.watch('setting')} onValueChange={(value) => form.setValue('setting', value as QuickLogValues['setting'])}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SETTINGS.map((setting) => (
                    <SelectItem key={setting.value} value={setting.value}>{setting.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea rows={3} placeholder="Brief notes" {...form.register('parent_raw_notes')} />
          <Button className="h-11 w-full" disabled={loading} type="submit">Save Quick Log</Button>
        </form>
      </CardContent>
    </Card>
  )
}
