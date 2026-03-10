import type { BehaviorFunction, BehaviorSeverity, ConsequenceType, IncidentSetting } from '@/lib/types/database'

export const DEFAULT_ANTECEDENTS = [
  { label: 'Asked to transition between activities', category: 'transition' },
  { label: 'Given a demand or instruction', category: 'demand' },
  { label: 'Preferred item/activity removed', category: 'demand' },
  { label: 'Told "no" or denied request', category: 'demand' },
  { label: 'Change in routine', category: 'routine_change' },
  { label: 'Unstructured/free time', category: 'environmental' },
  { label: 'Loud or overwhelming environment', category: 'environmental' },
  { label: 'Peer interaction/conflict', category: 'social' },
  { label: 'Left alone / attention withdrawn', category: 'social' },
  { label: 'New person or unfamiliar setting', category: 'social' },
  { label: 'Hunger or fatigue', category: 'physiological' },
  { label: 'Waiting / delayed reinforcement', category: 'demand' },
  { label: 'Difficult or non-preferred task', category: 'demand' },
  { label: 'Sensory input (light, sound, texture)', category: 'environmental' },
] as const

export const DEFAULT_CONSEQUENCES: ReadonlyArray<{ label: string; type: ConsequenceType }> = [
  { label: 'Verbal reprimand given', type: 'punishment_positive' },
  { label: 'Attention provided (comfort, discussion)', type: 'reinforcement_positive' },
  { label: 'Demand removed or delayed', type: 'reinforcement_negative' },
  { label: 'Preferred item/activity given', type: 'reinforcement_positive' },
  { label: 'Planned ignoring (extinction)', type: 'extinction' },
  { label: 'Redirected to alternative activity', type: 'redirection' },
  { label: 'Physical prompt or guidance', type: 'other' },
  { label: 'Time out / removal from environment', type: 'punishment_negative' },
  { label: 'Natural consequence occurred', type: 'other' },
  { label: 'Visual/verbal cue provided', type: 'redirection' },
  { label: 'Break offered', type: 'reinforcement_negative' },
  { label: 'Praise for replacement behavior', type: 'reinforcement_positive' },
]

export const BEHAVIOR_FUNCTIONS: ReadonlyArray<{
  value: BehaviorFunction
  label: string
  description: string
  color: string
}> = [
  {
    value: 'sensory',
    label: 'Sensory / Automatic',
    description: 'Behavior provides internal sensory stimulation',
    color: '#8B5CF6',
  },
  {
    value: 'escape',
    label: 'Escape / Avoidance',
    description: 'Behavior allows avoidance or removal of a demand, task, or situation',
    color: '#F59E0B',
  },
  {
    value: 'attention',
    label: 'Attention',
    description: 'Behavior results in social attention from others',
    color: '#3B82F6',
  },
  {
    value: 'tangible',
    label: 'Tangible / Access',
    description: 'Behavior results in access to a preferred item or activity',
    color: '#10B981',
  },
  {
    value: 'unknown',
    label: 'Unknown / Uncertain',
    description: 'Function not yet determined',
    color: '#6B7280',
  },
]

export const SEVERITY_LEVELS: ReadonlyArray<{
  value: BehaviorSeverity
  label: string
  description: string
  color: string
}> = [
  { value: 'low', label: 'Low', description: 'Minimal disruption, easily redirected', color: '#22C55E' },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Moderate disruption, requires intervention',
    color: '#F59E0B',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Significant disruption, difficult to redirect',
    color: '#F97316',
  },
  {
    value: 'crisis',
    label: 'Crisis',
    description: 'Safety concern, immediate intervention required',
    color: '#EF4444',
  },
]

export const SETTINGS: ReadonlyArray<{ value: IncidentSetting; label: string }> = [
  { value: 'home', label: 'Home' },
  { value: 'school', label: 'School' },
  { value: 'community', label: 'Community' },
  { value: 'therapy', label: 'Therapy' },
  { value: 'other', label: 'Other' },
]

export const MOOD_OPTIONS = ['Happy', 'Calm', 'Anxious', 'Irritable', 'Tired', 'Energetic', 'Sad', 'Neutral'] as const
