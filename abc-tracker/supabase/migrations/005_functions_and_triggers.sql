begin;

create or replace function public.update_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_child_profile_updated_at
before update on public.child_profile
for each row execute function public.update_row_updated_at();

create trigger update_incidents_updated_at
before update on public.incidents
for each row execute function public.update_row_updated_at();

create trigger update_daily_logs_updated_at
before update on public.daily_logs
for each row execute function public.update_row_updated_at();

create trigger update_app_users_updated_at
before update on public.app_users
for each row execute function public.update_row_updated_at();

create or replace function public.hash_pin(pin_text text)
returns text
language sql
security definer
set search_path = public
as $$
  select crypt(pin_text, gen_salt('bf', 10));
$$;

create or replace function public.verify_pin(pin_text text, hashed text)
returns boolean
language sql
stable
as $$
  select case
    when hashed is null then false
    else crypt(pin_text, hashed) = hashed
  end;
$$;

create or replace function public.authenticate_screen_name(login_screen_name text, login_pin text default null)
returns table (
  session_token text,
  session_expires_at timestamptz,
  app_user_id uuid,
  app_role app_user_role
)
language plpgsql
security definer
set search_path = public
as $$
declare
  found_user public.app_users%rowtype;
  raw_token text;
  token_ttl interval := interval '8 hours';
begin
  select *
  into found_user
  from public.app_users
  where screen_name = login_screen_name::citext
    and is_active = true;

  if not found then
    raise exception 'Invalid screen name';
  end if;

  if found_user.pin_hash is not null then
    if login_pin is null or not public.verify_pin(login_pin, found_user.pin_hash) then
      raise exception 'Invalid PIN';
    end if;
  end if;

  raw_token := encode(gen_random_bytes(32), 'hex');

  insert into public.app_user_sessions (app_user_id, token_hash, expires_at)
  values (found_user.id, encode(digest(raw_token, 'sha256'), 'hex'), now() + token_ttl);

  update public.app_users
  set last_login_at = now()
  where id = found_user.id;

  return query
  select raw_token, now() + token_ttl, found_user.id, found_user.role;
end;
$$;

create or replace function public.resolve_screen_session(session_token text)
returns table (
  app_user_id uuid,
  screen_name text,
  app_role app_user_role,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select u.id, u.screen_name::text, u.role, s.expires_at
  from public.app_user_sessions s
  join public.app_users u on u.id = s.app_user_id
  where s.token_hash = encode(digest(session_token, 'sha256'), 'hex')
    and s.revoked_at is null
    and s.expires_at > now()
    and u.is_active = true;
$$;

create or replace function public.revoke_screen_session(session_token text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.app_user_sessions
  set revoked_at = now()
  where token_hash = encode(digest(session_token, 'sha256'), 'hex')
    and revoked_at is null;
$$;

commit;
