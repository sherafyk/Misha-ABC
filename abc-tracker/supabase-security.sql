-- Read-only public access + explicit RLS policies.
-- Apply in Supabase SQL Editor.

alter table if exists child_profile enable row level security;
alter table if exists behavior_definitions enable row level security;
alter table if exists antecedent_options enable row level security;
alter table if exists consequence_options enable row level security;
alter table if exists incidents enable row level security;
alter table if exists incident_antecedents enable row level security;
alter table if exists incident_consequences enable row level security;
alter table if exists daily_logs enable row level security;
alter table if exists ai_notes enable row level security;

-- Remove broad policies if they exist.
drop policy if exists "Allow all on child_profile" on child_profile;
drop policy if exists "Allow all on behavior_definitions" on behavior_definitions;
drop policy if exists "Allow all on antecedent_options" on antecedent_options;
drop policy if exists "Allow all on consequence_options" on consequence_options;
drop policy if exists "Allow all on incidents" on incidents;
drop policy if exists "Allow all on incident_antecedents" on incident_antecedents;
drop policy if exists "Allow all on incident_consequences" on incident_consequences;
drop policy if exists "Allow all on daily_logs" on daily_logs;
drop policy if exists "Allow all on ai_notes" on ai_notes;

create policy "public read child_profile" on child_profile for select using (true);
create policy "public read behavior_definitions" on behavior_definitions for select using (true);
create policy "public read antecedent_options" on antecedent_options for select using (true);
create policy "public read consequence_options" on consequence_options for select using (true);
create policy "public read incidents" on incidents for select using (true);
create policy "public read incident_antecedents" on incident_antecedents for select using (true);
create policy "public read incident_consequences" on incident_consequences for select using (true);
create policy "public read daily_logs" on daily_logs for select using (true);
create policy "public read ai_notes" on ai_notes for select using (true);

-- No write policies for anon/authenticated.
-- Admin writes are handled server-side using SUPABASE_SERVICE_ROLE_KEY.
