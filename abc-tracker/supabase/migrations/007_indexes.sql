begin;

create index if not exists idx_behavior_definitions_active on public.behavior_definitions(is_active);
create index if not exists idx_antecedent_options_active on public.antecedent_options(is_active);
create index if not exists idx_consequence_options_active on public.consequence_options(is_active);
create index if not exists idx_incidents_occurred_at_desc on public.incidents(occurred_at desc);
create index if not exists idx_incidents_occurred_date on public.incidents(occurred_date);
create index if not exists idx_incidents_behavior_occurred on public.incidents(behavior_id, occurred_at desc);
create index if not exists idx_incidents_setting_occurred on public.incidents(setting, occurred_at desc);
create index if not exists idx_incidents_function_occurred on public.incidents(hypothesized_function, occurred_at desc);
create index if not exists idx_incidents_severity_occurred on public.incidents(severity, occurred_at desc);
create index if not exists idx_incident_antecedents_antecedent_id on public.incident_antecedents(antecedent_id);
create index if not exists idx_incident_consequences_consequence_id on public.incident_consequences(consequence_id);
create index if not exists idx_daily_logs_log_date_desc on public.daily_logs(log_date desc);
create index if not exists idx_ai_notes_incident_id on public.ai_notes(incident_id);
create index if not exists idx_ai_notes_daily_log_id on public.ai_notes(daily_log_id);
create index if not exists idx_ai_notes_note_type_created_at on public.ai_notes(note_type, created_at desc);
create index if not exists idx_app_users_role_active on public.app_users(role, is_active);
create index if not exists idx_app_sessions_user_expires on public.app_user_sessions(app_user_id, expires_at desc);

commit;
