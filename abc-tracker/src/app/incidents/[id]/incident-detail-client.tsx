'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { format } from 'date-fns'
import { Copy, Pencil, Share2, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { ABCFlowDisplay } from '@/components/cards/abc-flow-display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { createClient } from '@/lib/supabase/client'
import { useDeleteIncident, useIncident, useUpdateIncident } from '@/lib/hooks/use-incidents'

interface IncidentDetailClientProps {
  id: string
}

export function IncidentDetailClient({ id }: IncidentDetailClientProps) {
  const router = useRouter()
  const { incident, loading, error, refetch } = useIncident(id)
  const { deleteIncident, loading: deleting } = useDeleteIncident()
  const { updateIncident } = useUpdateIncident()
  const [aiLoading, setAiLoading] = useState(false)
  const [lastAIRequestAt, setLastAIRequestAt] = useState(0)

  const onDelete = async () => {
    const result = await deleteIncident(id)
    if (!result.error) {
      router.push('/incidents')
      router.refresh()
    }
  }

  const copyNotes = async () => {
    if (!incident) return
    const content = incident.ai_formatted_notes ?? incident.parent_raw_notes ?? ''
    await navigator.clipboard.writeText(content)
  }

  const generateAINote = async () => {
    if (!incident || aiLoading || Date.now() - lastAIRequestAt < 1200) return

    setAiLoading(true)
    setLastAIRequestAt(Date.now())

    try {
      const response = await fetch('/api/ai/format-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          antecedents: incident.antecedents?.map((item) => item.label) ?? [],
          behavior: incident.behavior?.name,
          consequences: incident.consequences?.map((item) => item.label) ?? [],
          severity: incident.severity,
          setting: incident.setting,
          parent_raw_notes: incident.parent_raw_notes ?? '',
          occurred_at: incident.occurred_at,
          duration_seconds: incident.duration_seconds,
          people_present: incident.people_present ?? undefined,
          environmental_factors: incident.environmental_factors ?? undefined,
        }),
      })

      const result = (await response.json()) as {
        formatted_note?: string
        suggested_function?: 'sensory' | 'escape' | 'attention' | 'tangible' | 'unknown'
        error?: string
      }

      if (!response.ok || !result.formatted_note) {
        throw new Error(result.error ?? 'Unable to generate AI note')
      }

      await updateIncident(id, {
        ai_formatted_notes: result.formatted_note,
        hypothesized_function: result.suggested_function ?? incident.hypothesized_function,
      })

      const supabase = createClient()
      await supabase.from('ai_notes').insert({
        incident_id: incident.id,
        daily_log_id: null,
        raw_input: incident.parent_raw_notes ?? JSON.stringify(incident),
        formatted_output: result.formatted_note,
        note_type: 'incident',
      })

      await refetch()
      toast.success('AI note generated')
    } catch (generationError) {
      toast.error(generationError instanceof Error ? generationError.message : 'Unable to generate AI note')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="p-4 text-sm text-slate-500">Loading incident…</CardContent></Card>
  }

  if (error || !incident) {
    return <Card><CardContent className="p-4 text-sm text-red-600">Unable to load this incident.</CardContent></Card>
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-xs text-slate-500">{format(new Date(incident.occurred_at), 'PPP p')}</p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">{incident.behavior?.name ?? 'Incident detail'}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">{incident.setting}</Badge>
            <Badge variant="secondary" className="capitalize">{incident.severity}</Badge>
            <Badge className="capitalize">{incident.hypothesized_function}</Badge>
          </div>
        </CardContent>
      </Card>

      <ABCFlowDisplay incident={incident} />

      <Card>
        <CardHeader><CardTitle className="text-base">Context</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
          <p><span className="font-medium">People present:</span> {incident.people_present ?? 'Not recorded'}</p>
          <p><span className="font-medium">Environmental factors:</span> {incident.environmental_factors ?? 'Not recorded'}</p>
          <p><span className="font-medium">Mood before:</span> {incident.mood_before ?? 'Not recorded'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Parent Notes</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-700">{incident.parent_raw_notes ?? 'No raw notes added.'}</CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">AI-Formatted Notes</CardTitle>
          {!incident.ai_formatted_notes && (
            <Button variant="outline" size="sm" onClick={() => void generateAINote()} disabled={aiLoading}>
              <Sparkles className="mr-1 h-4 w-4" /> {aiLoading ? 'AI is writing...' : 'Generate AI Note'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          {incident.ai_formatted_notes ?? 'No AI note generated yet.'}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href={`/log?incidentId=${incident.id}`}>
          <Button variant="outline"><Pencil className="mr-1 h-4 w-4" />Edit</Button>
        </Link>
        <Button variant="outline" onClick={copyNotes}><Copy className="mr-1 h-4 w-4" />Copy</Button>
        <Button variant="outline"><Share2 className="mr-1 h-4 w-4" />Share / Export</Button>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive"><Trash2 className="mr-1 h-4 w-4" />Delete</Button>} />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this incident?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The incident and its antecedent/consequence links will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} disabled={deleting}>Delete incident</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
