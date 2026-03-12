begin;

-- Fix stack depth recursion in RLS checks.
-- Previous current_app_role() queried public.app_users, but app_users policies
-- also call is_admin()/current_app_role(), which can recurse indefinitely.
create or replace function public.current_app_role()
returns app_user_role
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'app_role', '')::app_user_role,
    'caretaker'::app_user_role
  );
$$;

grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_caretaker_or_admin() to anon, authenticated;

commit;
