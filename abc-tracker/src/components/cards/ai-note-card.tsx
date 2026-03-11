'use client'

import { Copy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AINote } from '@/lib/types/database'

interface AINoteCardProps {
  note: AINote
  onRegenerate?: (note: AINote) => Promise<void> | void
}

export function AINoteCard({ note, onRegenerate }: AINoteCardProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(note.formatted_output)
    toast.success('Copied AI note to clipboard')
  }

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base capitalize">{note.note_type.replace('_', ' ')}</CardTitle>
        <p className="text-xs text-slate-500">Created {new Date(note.created_at).toLocaleString()}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <p className="mb-1 font-medium text-slate-800">Raw Input</p>
          <p className="line-clamp-4">{note.raw_input}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
          <p className="mb-1 font-medium text-slate-900">AI Output</p>
          <p className="whitespace-pre-wrap">{note.formatted_output}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-1 h-4 w-4" /> Copy
          </Button>
          {onRegenerate && (
            <Button type="button" variant="outline" size="sm" onClick={() => void onRegenerate(note)}>
              <RefreshCw className="mr-1 h-4 w-4" /> Regenerate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
