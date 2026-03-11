begin;

grant usage on schema public to anon, authenticated;

alter table public.child_profile enable row level security;
alter table public.behavior_definitions enable row level security;
alter table public.antecedent_options enable row level security;
alter table public.consequence_options enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_antecedents enable row level security;
alter table public.incident_consequences enable row level security;
alter table public.daily_logs enable row level security;
alter table public.ai_notes enable row level security;
alter table public.app_users enable row level security;
alter table public.app_user_sessions enable row level security;

create or replace function public.current_app_role()
returns app_user_role
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'app_role')::app_user_role,
    (select au.role from public.app_users au where au.auth_user_id = auth.uid())
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() = 'admin'::app_user_role;
$$;

create or replace function public.is_caretaker_or_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('admin'::app_user_role, 'caretaker'::app_user_role);
$$;

-- clean old policies when re-running
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('child_profile','behavior_definitions','antecedent_options','consequence_options','incidents','incident_antecedents','incident_consequences','daily_logs','ai_notes','app_users','app_user_sessions')
  LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- public read access
create policy "public read child_profile" on public.child_profile for select using (true);
create policy "public read behavior_definitions" on public.behavior_definitions for select using (true);
create policy "public read antecedent_options" on public.antecedent_options for select using (true);
create policy "public read consequence_options" on public.consequence_options for select using (true);
create policy "public read incidents" on public.incidents for select using (true);
create policy "public read incident_antecedents" on public.incident_antecedents for select using (true);
create policy "public read incident_consequences" on public.incident_consequences for select using (true);
create policy "public read daily_logs" on public.daily_logs for select using (true);
create policy "public read ai_notes" on public.ai_notes for select using (true);

-- role-limited writes
create policy "caretaker+admin write incidents" on public.incidents
for all to authenticated using (public.is_caretaker_or_admin()) with check (public.is_caretaker_or_admin());

create policy "caretaker+admin write incident antecedents" on public.incident_antecedents
for all to authenticated using (public.is_caretaker_or_admin()) with check (public.is_caretaker_or_admin());

create policy "caretaker+admin write incident consequences" on public.incident_consequences
for all to authenticated using (public.is_caretaker_or_admin()) with check (public.is_caretaker_or_admin());

create policy "caretaker+admin write daily logs" on public.daily_logs
for all to authenticated using (public.is_caretaker_or_admin()) with check (public.is_caretaker_or_admin());

create policy "caretaker+admin write ai notes" on public.ai_notes
for all to authenticated using (public.is_caretaker_or_admin()) with check (public.is_caretaker_or_admin());

create policy "admin write child profile" on public.child_profile
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin write behavior definitions" on public.behavior_definitions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin write antecedent options" on public.antecedent_options
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin write consequence options" on public.consequence_options
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin manage app users" on public.app_users
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins inspect app sessions" on public.app_user_sessions
for select to authenticated using (public.is_admin());

-- explicit grants
grant select on public.child_profile, public.behavior_definitions, public.antecedent_options, public.consequence_options,
  public.incidents, public.incident_antecedents, public.incident_consequences, public.daily_logs, public.ai_notes
to anon, authenticated;

grant insert, update, delete on public.incidents, public.incident_antecedents, public.incident_consequences, public.daily_logs, public.ai_notes
to authenticated;

grant insert, update, delete on public.child_profile, public.behavior_definitions, public.antecedent_options, public.consequence_options,
  public.app_users, public.app_user_sessions
to authenticated;

grant execute on function public.authenticate_screen_name(text, text) to anon, authenticated;
grant execute on function public.resolve_screen_session(text) to anon, authenticated;
grant execute on function public.revoke_screen_session(text) to anon, authenticated;
grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_caretaker_or_admin() to anon, authenticated;

commit;
