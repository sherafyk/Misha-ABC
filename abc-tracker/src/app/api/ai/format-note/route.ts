import OpenAI from 'openai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

import type { BehaviorFunction, BehaviorSeverity, IncidentSetting } from '@/lib/types/database'

const requestSchema = z.object({
  antecedents: z.array(z.string().min(1)).default([]),
  behavior: z.string().min(1).optional(),
  consequences: z.array(z.string().min(1)).default([]),
  severity: z.enum(['low', 'medium', 'high', 'crisis'] satisfies BehaviorSeverity[]),
  setting: z.enum(['home', 'school', 'community', 'therapy', 'other'] satisfies IncidentSetting[]),
  parent_raw_notes: z.string().optional(),
  occurred_at: z.string().optional(),
  duration_seconds: z.number().nullable().optional(),
  people_present: z.string().optional(),
  environmental_factors: z.string().optional(),
})

const responseSchema = z.object({
  formatted_note: z.string().min(1),
  suggested_function: z.enum(['sensory', 'escape', 'attention', 'tangible', 'unknown'] satisfies BehaviorFunction[]),
})

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export async function POST(request: Request) {
  if (!openai) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const parsed = requestSchema.parse(body)

    const completion = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content:
            'You are a clinical documentation assistant for ABA therapy. Rewrite caregiver observations using objective measurable language and proper ABA terms. Structure output as: Setting/Context → Antecedent → Behavior (topography) → Consequence → Hypothesized Function. Do not invent data. Return strict JSON with keys formatted_note and suggested_function.',
        },
        {
          role: 'user',
          content: JSON.stringify(parsed),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'formatted_incident_note',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              formatted_note: { type: 'string' },
              suggested_function: {
                type: 'string',
                enum: ['sensory', 'escape', 'attention', 'tangible', 'unknown'],
              },
            },
            required: ['formatted_note', 'suggested_function'],
          },
        },
      },
    })

    const output = completion.output_text?.trim()
    if (!output) {
      throw new Error('AI returned an empty response while formatting the note.')
    }

    const result = responseSchema.parse(JSON.parse(output))

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to format note right now.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
