-- Supabase Dashboard compatible seed script (no \i commands).

begin;

insert into public.antecedent_options (label, category, is_custom, sort_order)
values
  ('Asked to transition between activities', 'transition', false, 10),
  ('Given a demand or instruction', 'demand', false, 20),
  ('Preferred item/activity removed', 'demand', false, 30),
  ('Told "no" or denied request', 'demand', false, 40),
  ('Change in routine', 'routine_change', false, 50),
  ('Unstructured/free time', 'environmental', false, 60),
  ('Loud or overwhelming environment', 'environmental', false, 70),
  ('Peer interaction/conflict', 'social', false, 80),
  ('Left alone / attention withdrawn', 'social', false, 90),
  ('New person or unfamiliar setting', 'social', false, 100),
  ('Hunger or fatigue', 'physiological', false, 110),
  ('Waiting / delayed reinforcement', 'demand', false, 120),
  ('Difficult or non-preferred task', 'demand', false, 130),
  ('Sensory input (light, sound, texture)', 'environmental', false, 140)
on conflict do nothing;

insert into public.consequence_options (label, type, is_custom, sort_order)
values
  ('Verbal reprimand given', 'punishment_positive', false, 10),
  ('Attention provided (comfort, discussion)', 'reinforcement_positive', false, 20),
  ('Demand removed or delayed', 'reinforcement_negative', false, 30),
  ('Preferred item/activity given', 'reinforcement_positive', false, 40),
  ('Planned ignoring (extinction)', 'extinction', false, 50),
  ('Redirected to alternative activity', 'redirection', false, 60),
  ('Physical prompt or guidance', 'other', false, 70),
  ('Time out / removal from environment', 'punishment_negative', false, 80),
  ('Natural consequence occurred', 'other', false, 90),
  ('Visual/verbal cue provided', 'redirection', false, 100),
  ('Break offered', 'reinforcement_negative', false, 110),
  ('Praise for replacement behavior', 'reinforcement_positive', false, 120)
on conflict do nothing;

insert into public.child_profile (
  id, first_name, last_name, date_of_birth, diagnosis_notes, therapist_name, therapist_email, bcba_name, bcba_email, preferences
)
values (
  '00000000-0000-0000-0000-000000000001',
  'Alex',
  'Sample',
  '2018-05-15',
  'Replace this with actual child profile notes.',
  'Therapist Name',
  'therapist@example.com',
  'BCBA Name',
  'bcba@example.com',
  '{"languagePreference":"person_first","detailLevel":"detailed","includeRecommendations":false}'::jsonb
)
on conflict (id) do update
set first_name = excluded.first_name,
    last_name = excluded.last_name,
    date_of_birth = excluded.date_of_birth,
    diagnosis_notes = excluded.diagnosis_notes,
    therapist_name = excluded.therapist_name,
    therapist_email = excluded.therapist_email,
    bcba_name = excluded.bcba_name,
    bcba_email = excluded.bcba_email,
    preferences = excluded.preferences;

insert into public.app_users (screen_name, role, pin_hash, is_active)
values
  ('family-admin', 'admin', public.hash_pin('1234'), true),
  ('mom', 'caretaker', public.hash_pin('1111'), true),
  ('dad', 'caretaker', public.hash_pin('2222'), true)
on conflict (screen_name) do update
set role = excluded.role,
    pin_hash = excluded.pin_hash,
    is_active = excluded.is_active;

commit;
