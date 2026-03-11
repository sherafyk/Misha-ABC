insert into public.app_users (screen_name, role, pin_hash, is_active)
values
  ('family-admin', 'admin', public.hash_pin('1234'), true),
  ('mom', 'caretaker', public.hash_pin('1111'), true),
  ('dad', 'caretaker', public.hash_pin('2222'), true)
on conflict (screen_name) do update
set
  role = excluded.role,
  pin_hash = excluded.pin_hash,
  is_active = excluded.is_active;
