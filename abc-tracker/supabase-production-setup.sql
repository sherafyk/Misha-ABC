-- =========================================================
-- ABC Tracker - Production hardening + smooth operations
-- Run this AFTER your base schema is created.
-- =========================================================

begin;

-- 1) Ensure API roles can access schema
grant usage on schema public to anon, authenticated;

-- 2) Realtime + extension safety
create extension if not exists pgcrypto;

-- 3) Helpful indexes for common dashboard/report queries
create index if not exists idx_incidents_created_at_desc on public.incidents(created_at desc);
create index if not exists idx_incidents_behavior_occurred_at on public.incidents(behavior_id, occurred_at desc);
create index if not exists idx_incidents_setting_occurred_at on public.incidents(setting, occurred_at desc);
create index if not exists idx_incidents_function_occurred_at on public.incidents(hypothesized_function, occurred_at desc);
create index if not exists idx_daily_logs_log_date_desc on public.daily_logs(log_date desc);

-- 4) Enable RLS everywhere (idempotent)
alter table public.child_profile enable row level security;
alter table public.behavior_definitions enable row level security;
alter table public.antecedent_options enable row level security;
alter table public.consequence_options enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_antecedents enable row level security;
alter table public.incident_consequences enable row level security;
alter table public.daily_logs enable row level security;
alter table public.ai_notes enable row level security;

-- 5) Cleanup broad/legacy policies if they exist
drop policy if exists "Allow all on child_profile" on public.child_profile;
drop policy if exists "Allow all on behavior_definitions" on public.behavior_definitions;
drop policy if exists "Allow all on antecedent_options" on public.antecedent_options;
drop policy if exists "Allow all on consequence_options" on public.consequence_options;
drop policy if exists "Allow all on incidents" on public.incidents;
drop policy if exists "Allow all on incident_antecedents" on public.incident_antecedents;
drop policy if exists "Allow all on incident_consequences" on public.incident_consequences;
drop policy if exists "Allow all on daily_logs" on public.daily_logs;
drop policy if exists "Allow all on ai_notes" on public.ai_notes;

-- 6) Public read-only policies (for dashboard and history pages)
drop policy if exists "public read child_profile" on public.child_profile;
create policy "public read child_profile" on public.child_profile for select using (true);

drop policy if exists "public read behavior_definitions" on public.behavior_definitions;
create policy "public read behavior_definitions" on public.behavior_definitions for select using (true);

drop policy if exists "public read antecedent_options" on public.antecedent_options;
create policy "public read antecedent_options" on public.antecedent_options for select using (true);

drop policy if exists "public read consequence_options" on public.consequence_options;
create policy "public read consequence_options" on public.consequence_options for select using (true);

drop policy if exists "public read incidents" on public.incidents;
create policy "public read incidents" on public.incidents for select using (true);

drop policy if exists "public read incident_antecedents" on public.incident_antecedents;
create policy "public read incident_antecedents" on public.incident_antecedents for select using (true);

drop policy if exists "public read incident_consequences" on public.incident_consequences;
create policy "public read incident_consequences" on public.incident_consequences for select using (true);

drop policy if exists "public read daily_logs" on public.daily_logs;
create policy "public read daily_logs" on public.daily_logs for select using (true);

drop policy if exists "public read ai_notes" on public.ai_notes;
create policy "public read ai_notes" on public.ai_notes for select using (true);

-- 7) Grant explicit SELECT privileges (fixes many "permission denied" issues)
grant select on public.child_profile to anon, authenticated;
grant select on public.behavior_definitions to anon, authenticated;
grant select on public.antecedent_options to anon, authenticated;
grant select on public.consequence_options to anon, authenticated;
grant select on public.incidents to anon, authenticated;
grant select on public.incident_antecedents to anon, authenticated;
grant select on public.incident_consequences to anon, authenticated;
grant select on public.daily_logs to anon, authenticated;
grant select on public.ai_notes to anon, authenticated;



-- 7b) Allow authenticated users to read their own app user row
-- so role helper functions can resolve safely under RLS.
drop policy if exists "users read own app user" on public.app_users;
create policy "users read own app user" on public.app_users
for select
to authenticated
using (auth.uid() = auth_user_id);

grant select on public.app_users to authenticated;

-- 8) Optional: create an admin-check helper for future Supabase Auth workflows
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- 9) Optional admin write policies (disabled by default with "false")
-- If you later switch to Supabase Auth admin users, flip "false" -> "true" and keep USING/WITH CHECK is_admin().
drop policy if exists "admin write incidents" on public.incidents;
create policy "admin write incidents" on public.incidents
for all
to authenticated
using (false and public.is_admin())
with check (false and public.is_admin());

commit;
