-- Master seed file for Supabase SQL Editor/CLI.
-- Run after all migrations.

begin;

-- 1) lookup defaults
\i ./seeds/001_lookup_seed.sql

-- 2) child profile + behaviors
\i ./seeds/002_core_seed.sql

-- 3) app users (admin + caretakers)
\i ./seeds/003_users_seed.sql

commit;
