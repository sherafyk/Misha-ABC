import OpenAI from 'openai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const incidentSchema = z.object({
  occurred_at: z.string(),
  setting: z.string(),
  severity: z.string(),
  hypothesized_function: z.string(),
  behavior_notes: z.string().nullable().optional(),
  parent_raw_notes: z.string().nullable().optional(),
})

const dailyLogSchema = z
  .object({
    overall_mood: z.string().nullable().optional(),
    sleep_quality: z.string().nullable().optional(),
    sleep_hours: z.number().nullable().optional(),
    medication_given: z.boolean().optional(),
    medication_notes: z.string().nullable().optional(),
    diet_notes: z.string().nullable().optional(),
    general_notes: z.string().nullable().optional(),
  })
  .nullable()
  .optional()

const requestSchema = z.object({
  date: z.string(),
  incidents: z.array(incidentSchema).default([]),
  daily_log: dailyLogSchema,
})

const responseSchema = z.object({ summary: z.string().min(1) })

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
            'Summarize daily ABA incident data for provider review. Highlight patterns in antecedents, behavior frequency/severity, consequences, and contextual daily factors. Stay descriptive and do not prescribe treatment. Return strict JSON with key summary.',
        },
        {
          role: 'user',
          content: JSON.stringify(parsed),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'daily_summary',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              summary: { type: 'string' },
            },
            required: ['summary'],
          },
        },
      },
    })

    const output = completion.output_text?.trim()
    if (!output) {
      throw new Error('AI returned an empty response while generating the summary.')
    }

    return NextResponse.json(responseSchema.parse(JSON.parse(output)))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to generate summary.' },
      { status: 500 },
    )
  }
}
