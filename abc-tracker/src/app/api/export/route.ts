import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(['csv', 'json']).default('csv'),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.parse(Object.fromEntries(searchParams.entries()))

    const supabase = await createClient()
    let query = supabase.from('incidents').select('*').order('occurred_at', { ascending: false })

    if (parsed.startDate) query = query.gte('occurred_at', parsed.startDate)
    if (parsed.endDate) query = query.lte('occurred_at', parsed.endDate)

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const incidents = data ?? []
    if (parsed.format === 'json') {
      return NextResponse.json({ incidents })
    }

    const headers = [
      'occurred_at',
      'setting',
      'severity',
      'hypothesized_function',
      'duration_seconds',
      'behavior_id',
      'parent_raw_notes',
      'ai_formatted_notes',
    ]

    const escapeCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`

    const rows = incidents.map((incident) => headers.map((header) => escapeCell(incident[header as keyof typeof incident])).join(','))

    const csv = [headers.join(','), ...rows].join('\n')

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="abc-incidents-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to export incidents.' },
      { status: 400 },
    )
  }
}
