begin;

create table public.child_profile (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  date_of_birth date,
  diagnosis_notes text,
  therapist_name text,
  therapist_email text,
  bcba_name text,
  bcba_email text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.behavior_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  operational_definition text not null,
  examples text,
  non_examples text,
  is_target_behavior boolean not null default true,
  is_replacement_behavior boolean not null default false,
  color text not null default '#3B82F6',
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.antecedent_options (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text not null default 'other',
  is_custom boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.consequence_options (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  type consequence_type not null default 'other',
  is_custom boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  occurred_date date generated always as ((occurred_at at time zone 'America/Los_Angeles')::date) stored,
  duration_seconds integer,
  setting incident_setting not null default 'home',
  setting_detail text,
  behavior_id uuid not null references public.behavior_definitions(id) on delete restrict,
  behavior_notes text,
  severity behavior_severity not null default 'medium',
  antecedent_notes text,
  consequence_notes text,
  hypothesized_function behavior_function not null default 'unknown',
  people_present text,
  environmental_factors text,
  mood_before text,
  parent_raw_notes text,
  ai_formatted_notes text,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.incident_antecedents (
  incident_id uuid not null references public.incidents(id) on delete cascade,
  antecedent_id uuid not null references public.antecedent_options(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (incident_id, antecedent_id)
);

create table public.incident_consequences (
  incident_id uuid not null references public.incidents(id) on delete cascade,
  consequence_id uuid not null references public.consequence_options(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (incident_id, consequence_id)
);

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date not null unique,
  overall_mood text,
  sleep_quality text,
  sleep_hours numeric(4,2),
  medication_given boolean not null default false,
  medication_notes text,
  diet_notes text,
  general_notes text,
  ai_formatted_summary text,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_notes (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  daily_log_id uuid references public.daily_logs(id) on delete cascade,
  raw_input text not null,
  formatted_output text not null,
  note_type ai_note_type not null default 'general',
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  constraint ai_notes_single_target_check check (
    (incident_id is null and daily_log_id is not null)
    or (incident_id is not null and daily_log_id is null)
    or (incident_id is null and daily_log_id is null)
  )
);

commit;
