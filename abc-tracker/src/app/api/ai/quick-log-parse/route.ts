import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAppSession } from '@/lib/app-session'

const optionSchema = z.object({ id: z.string().uuid(), label: z.string().min(1) })

const requestSchema = z.object({
  summary: z.string().min(3),
  occurred_at: z.string().datetime().optional(),
  behaviors: z.array(optionSchema).min(1),
  antecedents: z.array(optionSchema).default([]),
  consequences: z.array(optionSchema).default([]),
})

const responseSchema = z.object({
  setting: z.enum(['home', 'school', 'community', 'therapy', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'crisis']),
  hypothesized_function: z.enum(['sensory', 'escape', 'attention', 'tangible', 'unknown']),
  behavior_id: z.string().uuid(),
  antecedent_ids: z.array(z.string().uuid()).max(1),
  consequence_ids: z.array(z.string().uuid()).max(1),
  ai_formatted_notes: z.string().min(1),
  occurred_at: z.string().datetime(),
})

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export async function POST(request: Request) {
  try {
    await requireAppSession()

    const body = requestSchema.parse(await request.json())
    const defaultOccurredAt = body.occurred_at ?? new Date().toISOString()

    if (!openai) {
      return NextResponse.json({
        setting: 'home',
        severity: 'medium',
        hypothesized_function: 'unknown',
        behavior_id: body.behaviors[0].id,
        antecedent_ids: [],
        consequence_ids: [],
        ai_formatted_notes: body.summary,
        occurred_at: defaultOccurredAt,
      })
    }

    const completion = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content:
            'You convert caregiver free-text into structured ABC fields. Select IDs only from the provided options. Use exactly 1 behavior_id, exactly 1 antecedent_id, and exactly 1 consequence_id whenever options are provided. Never invent IDs. Always return occurred_at as an ISO 8601 datetime string with timezone. If the summary includes a date/time, parse and normalize it to ISO 8601. If timing is unclear, use the provided default_occurred_at value. Return strict JSON matching schema.',
        },
        {
          role: 'user',
          content: JSON.stringify({ ...body, default_occurred_at: defaultOccurredAt }),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'quick_log_parse',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              setting: { type: 'string', enum: ['home', 'school', 'community', 'therapy', 'other'] },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'crisis'] },
              hypothesized_function: { type: 'string', enum: ['sensory', 'escape', 'attention', 'tangible', 'unknown'] },
              behavior_id: { type: 'string' },
              antecedent_ids: { type: 'array', items: { type: 'string' } },
              consequence_ids: { type: 'array', items: { type: 'string' } },
              ai_formatted_notes: { type: 'string' },
              occurred_at: { type: 'string' },
            },
            required: [
              'setting',
              'severity',
              'hypothesized_function',
              'behavior_id',
              'antecedent_ids',
              'consequence_ids',
              'ai_formatted_notes',
              'occurred_at',
            ],
          },
        },
      },
    })

    const output = completion.output_text?.trim()
    if (!output) {
      throw new Error('AI returned an empty response.')
    }

    const parsed = responseSchema.parse(JSON.parse(output))

    const validBehavior = body.behaviors.some((behavior) => behavior.id === parsed.behavior_id)
    if (!validBehavior) {
      parsed.behavior_id = body.behaviors[0].id
    }

    const validAntecedents = parsed.antecedent_ids.filter((id) => body.antecedents.some((item) => item.id === id))
    const validConsequences = parsed.consequence_ids.filter((id) => body.consequences.some((item) => item.id === id))

    parsed.antecedent_ids = validAntecedents.slice(0, 1)
    parsed.consequence_ids = validConsequences.slice(0, 1)

    if (!parsed.antecedent_ids.length && body.antecedents.length) {
      parsed.antecedent_ids = [body.antecedents[0].id]
    }

    if (!parsed.consequence_ids.length && body.consequences.length) {
      parsed.consequence_ids = [body.consequences[0].id]
    }

    if (!parsed.occurred_at) {
      parsed.occurred_at = defaultOccurredAt
    }

    return NextResponse.json(parsed)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required.') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to parse quick log.',
      },
      { status: 500 },
    )
  }
}
