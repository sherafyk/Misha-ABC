begin;

create type behavior_function as enum ('sensory', 'escape', 'attention', 'tangible', 'unknown');
create type behavior_severity as enum ('low', 'medium', 'high', 'crisis');
create type incident_setting as enum ('home', 'school', 'community', 'therapy', 'other');
create type consequence_type as enum (
  'reinforcement_positive',
  'reinforcement_negative',
  'punishment_positive',
  'punishment_negative',
  'extinction',
  'redirection',
  'other'
);
create type ai_note_type as enum ('incident', 'daily_summary', 'progress_report', 'general');
create type app_user_role as enum ('admin', 'caretaker');

commit;
