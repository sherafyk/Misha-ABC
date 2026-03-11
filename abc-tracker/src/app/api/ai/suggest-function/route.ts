import OpenAI from 'openai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const requestSchema = z.object({
  antecedents: z.array(z.string()).default([]),
  behavior: z.string().optional(),
  consequences: z.array(z.string()).default([]),
  context: z.string().optional(),
})

const responseSchema = z.object({
  suggested_function: z.enum(['sensory', 'escape', 'attention', 'tangible', 'unknown']),
  confidence: z.enum(['low', 'medium', 'high']),
  reasoning: z.string().min(1),
})

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = requestSchema.parse(body)

    if (!openai) {
      return NextResponse.json(
        {
          suggested_function: 'unknown',
          confidence: 'low',
          reasoning: 'AI function suggestions are unavailable because OPENAI_API_KEY is not configured.',
        },
        { status: 200 },
      )
    }

    const completion = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content:
            'You analyze ABC incident data and suggest likely behavior function. This is not a diagnosis. Return strict JSON with suggested_function, confidence, reasoning.',
        },
        { role: 'user', content: JSON.stringify(parsed) },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'function_suggestion',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              suggested_function: { type: 'string', enum: ['sensory', 'escape', 'attention', 'tangible', 'unknown'] },
              confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
              reasoning: { type: 'string' },
            },
            required: ['suggested_function', 'confidence', 'reasoning'],
          },
        },
      },
    })

    const output = completion.output_text?.trim()
    if (!output) {
      throw new Error('AI returned an empty response while suggesting function.')
    }

    return NextResponse.json(responseSchema.parse(JSON.parse(output)))
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to suggest function.',
      },
      { status: 500 },
    )
  }
}
