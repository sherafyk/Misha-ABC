begin;

-- Allow authenticated users to read their own app_users row so
-- current_app_role() and session hydration can resolve role safely
-- during RLS checks on incident/daily-log/AI-note mutations.
drop policy if exists "users read own app user" on public.app_users;
create policy "users read own app user" on public.app_users
for select to authenticated
using (auth.uid() = auth_user_id);

grant select on public.app_users to authenticated;

commit;
