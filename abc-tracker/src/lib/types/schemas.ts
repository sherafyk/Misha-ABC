import { z } from 'zod'

import { BEHAVIOR_FUNCTIONS, MOOD_OPTIONS, SETTINGS } from '@/lib/constants/abc-options'

const settingValues = SETTINGS.map((item) => item.value)
const functionValues = BEHAVIOR_FUNCTIONS.map((item) => item.value)
const moodValues = [...MOOD_OPTIONS]

export const incidentFormSchema = z.object({
  occurred_at: z.string().min(1, 'Date and time are required'),
  setting: z.enum(settingValues as [string, ...string[]]),
  setting_detail: z.string().max(120).optional().or(z.literal('')),
  duration_minutes: z.coerce.number().min(0).max(720).optional(),
  duration_seconds_only: z.coerce.number().min(0).max(59).optional(),
  antecedent_ids: z.array(z.string()).min(1, 'Select at least one antecedent'),
  antecedent_notes: z.string().max(2000).optional().or(z.literal('')),
  behavior_id: z.string().min(1, 'Choose a behavior'),
  behavior_notes: z.string().max(2000).optional().or(z.literal('')),
  severity: z.enum(['low', 'medium', 'high', 'crisis']),
  consequence_ids: z.array(z.string()).min(1, 'Select at least one consequence'),
  consequence_notes: z.string().max(2000).optional().or(z.literal('')),
  hypothesized_function: z.enum(functionValues as [string, ...string[]]),
  people_present: z.array(z.string()).optional().default([]),
  environmental_factors: z.array(z.string()).optional().default([]),
  mood_before: z.enum(moodValues as [string, ...string[]]).optional(),
  parent_raw_notes: z.string().max(4000).optional().or(z.literal('')),
  ai_formatted_notes: z.string().max(4000).optional().or(z.literal('')),
})

export type IncidentFormValues = z.infer<typeof incidentFormSchema>

export const quickLogSchema = z.object({
  occurred_at: z.string().min(1, 'Date and time are required'),
  behavior_id: z.string().min(1, 'Choose a behavior'),
  severity: z.enum(['low', 'medium', 'high', 'crisis']),
  setting: z.enum(settingValues as [string, ...string[]]),
  parent_raw_notes: z.string().max(1000).optional().or(z.literal('')),
})

export type QuickLogValues = z.infer<typeof quickLogSchema>
