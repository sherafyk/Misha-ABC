export type BehaviorFunction = 'sensory' | 'escape' | 'attention' | 'tangible' | 'unknown'
export type BehaviorSeverity = 'low' | 'medium' | 'high' | 'crisis'
export type IncidentSetting = 'home' | 'school' | 'community' | 'therapy' | 'other'
export type ConsequenceType =
  | 'reinforcement_positive'
  | 'reinforcement_negative'
  | 'punishment_positive'
  | 'punishment_negative'
  | 'extinction'
  | 'redirection'
  | 'other'

export interface ChildProfile {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  diagnosis_notes: string | null
  therapist_name: string | null
  therapist_email: string | null
  bcba_name: string | null
  bcba_email: string | null
  created_at: string
  updated_at: string
}

export interface BehaviorDefinition {
  id: string
  name: string
  operational_definition: string
  examples: string | null
  non_examples: string | null
  is_target_behavior: boolean
  is_replacement_behavior: boolean
  color: string
  icon: string | null
  created_at: string
}

export interface AntecedentOption {
  id: string
  label: string
  category: string
  is_custom: boolean
  created_at: string
}

export interface ConsequenceOption {
  id: string
  label: string
  type: ConsequenceType
  is_custom: boolean
  created_at: string
}

export interface Incident {
  id: string
  occurred_at: string
  duration_seconds: number | null
  setting: IncidentSetting
  setting_detail: string | null
  antecedent_ids: string[]
  antecedent_notes: string | null
  behavior_id: string
  behavior_notes: string | null
  severity: BehaviorSeverity
  consequence_ids: string[]
  consequence_notes: string | null
  hypothesized_function: BehaviorFunction
  parent_raw_notes: string | null
  ai_formatted_notes: string | null
  people_present: string | null
  environmental_factors: string | null
  mood_before: string | null
  created_at: string
  updated_at: string
  behavior?: BehaviorDefinition
  antecedents?: AntecedentOption[]
  consequences?: ConsequenceOption[]
}

export interface DailyLog {
  id: string
  log_date: string
  overall_mood: string | null
  sleep_quality: string | null
  sleep_hours: number | null
  medication_given: boolean
  medication_notes: string | null
  diet_notes: string | null
  general_notes: string | null
  ai_formatted_summary: string | null
  created_at: string
  updated_at: string
}

export interface AINote {
  id: string
  incident_id: string | null
  daily_log_id: string | null
  raw_input: string
  formatted_output: string
  note_type: 'incident' | 'daily_summary' | 'progress_report' | 'general'
  created_at: string
}
