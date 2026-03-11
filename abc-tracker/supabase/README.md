# Supabase Fresh Start: Migrations, Seeds, Roles, and Screen-Name Login

This folder is a clean, step-by-step Supabase bootstrap for ABC Tracker.

## What this includes

- `migrations/001_extensions.sql` → required extensions.
- `migrations/002_enums.sql` → all enum types.
- `migrations/003_core_tables.sql` → app domain tables (ABC data).
- `migrations/004_auth_tables.sql` → `app_users` and screen-name session tables.
- `migrations/005_functions_and_triggers.sql` → timestamps, PIN hashing, screen-name login/session RPCs.
- `migrations/006_rls_and_permissions.sql` → RLS + admin/caretaker permission model.
- `migrations/007_indexes.sql` → performance indexes.
- `seeds/*.sql` → lookup + starter child + starter users.
- `seed.sql` → master seed for Supabase CLI/psql.
- `seed-editor.sql` → single-file seed for Supabase SQL Editor.

## Permission model

### Roles

- `admin`: full write access (profile, behaviors, antecedents/consequences, incidents, logs, AI notes, user management).
- `caretaker`: can create/update incidents, incident links, daily logs, and AI notes.
- `anon`: read-only access to reporting/dashboard tables.

### How permissions are evaluated

- For Supabase Auth users, role comes from either:
  - `auth.jwt().app_metadata.app_role`
  - or mapped `app_users.auth_user_id`
- For screen-name-only mode, sessions are created in `app_user_sessions` using SQL RPC functions:
  - `public.authenticate_screen_name(login_screen_name, login_pin)`
  - `public.resolve_screen_session(session_token)`
  - `public.revoke_screen_session(session_token)`

## Fresh setup in Supabase dashboard

1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Run each migration file in order:
   1. `migrations/001_extensions.sql`
   2. `migrations/002_enums.sql`
   3. `migrations/003_core_tables.sql`
   4. `migrations/004_auth_tables.sql`
   5. `migrations/005_functions_and_triggers.sql`
   6. `migrations/006_rls_and_permissions.sql`
   7. `migrations/007_indexes.sql`
4. Run `seed-editor.sql` (or use CLI with `seed.sql`).
5. Rotate the example PINs immediately in production.

## Fresh setup with Supabase CLI (recommended)

From `abc-tracker/`:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

> `seed.sql` uses `\i` includes, which work in `psql` but not in the Supabase Dashboard SQL editor.

## Create admin/caretaker users (SQL examples)

```sql
insert into public.app_users (screen_name, role, pin_hash)
values ('carelead', 'admin', public.hash_pin('8391'));

insert into public.app_users (screen_name, role, pin_hash)
values ('nana', 'caretaker', public.hash_pin('4582'));
```

## Screen-name login flow (API/backend integration contract)

1. Call `select * from public.authenticate_screen_name('mom', '1111');`
2. Store returned `session_token` in an HTTP-only cookie.
3. Resolve session on each request with `public.resolve_screen_session(token)`.
4. Revoke at logout using `public.revoke_screen_session(token)`.

This enables login with screen name (plus optional PIN) without forcing email/password UX.

## Enhanced login UI guidance (app side)

Use a two-panel card:

- **Panel A: Caretaker Login**
  - Screen name
  - Optional PIN
  - “Continue as Caretaker” button
- **Panel B: Admin Login**
  - Screen name or admin credential
  - PIN/password
  - “Enter Admin Mode” button

Display role badge after login (`Admin` / `Caretaker`) and gate editing affordances by role.
