'use client'

import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { AINoteCard } from '@/components/cards/ai-note-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useAINotes } from '@/lib/hooks/use-ai-notes'
import { useDailyLogs } from '@/lib/hooks/use-daily-logs'
import { useIncidents } from '@/lib/hooks/use-incidents'

export default function AINotesPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(false)

  const { incidents } = useIncidents()
  const { dailyLogs } = useDailyLogs()
  const { notes, loading, error, refetch } = useAINotes()

  const incidentsForDate = useMemo(
    () => incidents.filter((incident) => incident.occurred_at.slice(0, 10) === date),
    [date, incidents],
  )
  const dailyLog = useMemo(() => dailyLogs.find((log) => log.log_date.slice(0, 10) === date) ?? null, [dailyLogs, date])

  const saveAINote = async (payload: { raw_input: string; formatted_output: string; note_type: 'daily_summary' | 'progress_report' | 'incident' | 'general'; incident_id?: string | null; daily_log_id?: string | null }) => {
    const supabase = createClient()
    const { error: insertError } = await supabase.from('ai_notes').insert(payload)
    if (insertError) {
      throw insertError
    }
    await refetch()
  }

  const generateDailySummary = async () => {
    setLoadingSummary(true)
    try {
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, incidents: incidentsForDate, daily_log: dailyLog }),
      })

      const result = (await response.json()) as { summary?: string; error?: string }
      if (!response.ok || !result.summary) {
        throw new Error(result.error ?? 'Failed to generate summary')
      }

      await saveAINote({
        raw_input: JSON.stringify({ date, incidents: incidentsForDate, dailyLog }),
        formatted_output: result.summary,
        note_type: 'daily_summary',
        daily_log_id: dailyLog?.id,
      })
      toast.success('Daily AI summary generated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to generate summary')
    } finally {
      setLoadingSummary(false)
    }
  }

  const generateProgressReport = async () => {
    setLoadingProgress(true)
    try {
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: `${date} progress report`,
          incidents: incidents.slice(0, 50),
          daily_log: null,
        }),
      })

      const result = (await response.json()) as { summary?: string; error?: string }
      if (!response.ok || !result.summary) {
        throw new Error(result.error ?? 'Unable to generate progress report')
      }

      await saveAINote({
        raw_input: JSON.stringify({ incidentsSampleSize: Math.min(50, incidents.length) }),
        formatted_output: result.summary,
        note_type: 'progress_report',
      })
      toast.success('Progress report generated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to generate progress report')
    } finally {
      setLoadingProgress(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-teal-600" /> AI Notes Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Select date</p>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11 w-52" />
            </div>
            <Button type="button" className="h-11" onClick={generateDailySummary} disabled={loadingSummary}>
              {loadingSummary ? 'AI is writing...' : 'Generate Daily Summary'}
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={generateProgressReport} disabled={loadingProgress}>
              {loadingProgress ? 'Generating...' : 'Generate Progress Report'}
            </Button>
          </div>
          <p className="text-sm text-slate-500">
            Date includes {incidentsForDate.length} incident(s)
            {dailyLog ? ' and a daily log entry.' : ' and no daily log entry yet.'}
          </p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">Failed to load AI notes: {error}</p>}
      {loading ? <p className="text-sm text-slate-500">Loading AI notes…</p> : null}

      {!loading && notes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-500">No AI notes yet. Generate one above to get started.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <AINoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}
