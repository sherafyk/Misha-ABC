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

export type IncidentFormValues = z.input<typeof incidentFormSchema>

export const quickLogSchema = z.object({
  occurred_at: z.string().min(1, 'Date and time are required'),
  behavior_id: z.string().min(1, 'Choose a behavior'),
  severity: z.enum(['low', 'medium', 'high', 'crisis']),
  setting: z.enum(settingValues as [string, ...string[]]),
  parent_raw_notes: z.string().max(1000).optional().or(z.literal('')),
})

export type QuickLogValues = z.input<typeof quickLogSchema>

export const dailyLogSchema = z
  .object({
    log_date: z.string().min(1, 'Date is required'),
    overall_mood: z.enum(['😊', '😐', '😟', '😠', '😴', '⚡']).nullable().optional(),
    sleep_quality: z.enum(['Poor', 'Fair', 'Good', 'Excellent']).nullable().optional(),
    sleep_hours: z
      .number()
      .min(0, 'Sleep hours cannot be negative')
      .max(24, 'Sleep hours cannot exceed 24')
      .nullable()
      .optional(),
    medication_given: z.boolean(),
    medication_notes: z.string().max(1000).optional().or(z.literal('')),
    diet_notes: z.string().max(2000).optional().or(z.literal('')),
    general_notes: z.string().max(4000).optional().or(z.literal('')),
    ai_formatted_summary: z.string().max(4000).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.medication_given && !data.medication_notes?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Medication notes are required when medication is marked as given',
        path: ['medication_notes'],
      })
    }
  })

export type DailyLogFormValues = z.input<typeof dailyLogSchema>
