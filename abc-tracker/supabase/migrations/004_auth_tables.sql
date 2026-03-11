begin;

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  screen_name citext not null unique,
  role app_user_role not null,
  pin_hash text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_screen_name_length check (char_length(screen_name::text) between 3 and 40)
);

create table public.app_user_sessions (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.incidents
  add constraint incidents_created_by_user_id_fkey
  foreign key (created_by_user_id) references public.app_users(id) on delete set null;

alter table public.daily_logs
  add constraint daily_logs_created_by_user_id_fkey
  foreign key (created_by_user_id) references public.app_users(id) on delete set null;

alter table public.ai_notes
  add constraint ai_notes_created_by_user_id_fkey
  foreign key (created_by_user_id) references public.app_users(id) on delete set null;

commit;
