import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAppSession } from '@/lib/app-session'
import { createClient } from '@/lib/supabase/server'

const querySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  format: z.enum(['csv', 'json']).default('csv'),
})

type ExportIncidentRow = {
  id: string
  occurred_at: string
  setting: string
  setting_detail: string | null
  severity: string
  hypothesized_function: string
  duration_seconds: number | null
  behavior_notes: string | null
  antecedent_notes: string | null
  consequence_notes: string | null
  parent_raw_notes: string | null
  ai_formatted_notes: string | null
  people_present: string | null
  environmental_factors: string | null
  mood_before: string | null
  behavior_definitions: { name: string | null } | { name: string | null }[] | null
  incident_antecedents: { antecedent_options: { label: string | null } | { label: string | null }[] | null }[] | null
  incident_consequences: { consequence_options: { label: string | null } | { label: string | null }[] | null }[] | null
}

const csvHeaders = [
  'id',
  'occurred_at',
  'setting',
  'setting_detail',
  'severity',
  'hypothesized_function',
  'duration_seconds',
  'behavior_name',
  'antecedents',
  'consequences',
  'behavior_notes',
  'antecedent_notes',
  'consequence_notes',
  'people_present',
  'environmental_factors',
  'mood_before',
  'parent_raw_notes',
  'ai_formatted_notes',
]

const escapeCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`

const normalizeForExport = (incident: ExportIncidentRow) => ({
  id: incident.id,
  occurred_at: incident.occurred_at,
  setting: incident.setting,
  setting_detail: incident.setting_detail,
  severity: incident.severity,
  hypothesized_function: incident.hypothesized_function,
  duration_seconds: incident.duration_seconds,
  behavior_name: Array.isArray(incident.behavior_definitions)
    ? (incident.behavior_definitions[0]?.name ?? '')
    : (incident.behavior_definitions?.name ?? ''),
  antecedents: (incident.incident_antecedents ?? [])
    .map((item) => Array.isArray(item.antecedent_options) ? item.antecedent_options[0]?.label : item.antecedent_options?.label)
    .filter((value): value is string => Boolean(value))
    .join('; '),
  consequences: (incident.incident_consequences ?? [])
    .map((item) => Array.isArray(item.consequence_options) ? item.consequence_options[0]?.label : item.consequence_options?.label)
    .filter((value): value is string => Boolean(value))
    .join('; '),
  behavior_notes: incident.behavior_notes,
  antecedent_notes: incident.antecedent_notes,
  consequence_notes: incident.consequence_notes,
  people_present: incident.people_present,
  environmental_factors: incident.environmental_factors,
  mood_before: incident.mood_before,
  parent_raw_notes: incident.parent_raw_notes,
  ai_formatted_notes: incident.ai_formatted_notes,
})

export async function GET(request: Request) {
  try {
    await requireAppSession()

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.parse(Object.fromEntries(searchParams.entries()))

    const supabase = await createClient()
    let query = supabase
      .from('incidents')
      .select(
        'id,occurred_at,setting,setting_detail,severity,hypothesized_function,duration_seconds,behavior_notes,antecedent_notes,consequence_notes,parent_raw_notes,ai_formatted_notes,people_present,environmental_factors,mood_before,behavior_definitions(name),incident_antecedents(antecedent_options(label)),incident_consequences(consequence_options(label))',
      )
      .order('occurred_at', { ascending: false })

    if (parsed.startDate) query = query.gte('occurred_at', `${parsed.startDate}T00:00:00.000Z`)
    if (parsed.endDate) query = query.lte('occurred_at', `${parsed.endDate}T23:59:59.999Z`)

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const incidents = ((data ?? []) as unknown as ExportIncidentRow[]).map(normalizeForExport)

    if (parsed.format === 'json') {
      return NextResponse.json({ incidents })
    }

    const rows = incidents.map((incident) => csvHeaders.map((header) => escapeCell(incident[header as keyof typeof incident])).join(','))

    const csv = [csvHeaders.join(','), ...rows].join('\n')

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="abc-incidents-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required.') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to export incidents.' },
      { status: 400 },
    )
  }
}
