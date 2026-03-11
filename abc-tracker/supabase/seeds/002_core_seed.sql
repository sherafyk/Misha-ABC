insert into public.child_profile (
  id,
  first_name,
  last_name,
  date_of_birth,
  diagnosis_notes,
  therapist_name,
  therapist_email,
  bcba_name,
  bcba_email,
  preferences
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
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  date_of_birth = excluded.date_of_birth,
  diagnosis_notes = excluded.diagnosis_notes,
  therapist_name = excluded.therapist_name,
  therapist_email = excluded.therapist_email,
  bcba_name = excluded.bcba_name,
  bcba_email = excluded.bcba_email,
  preferences = excluded.preferences;

insert into public.behavior_definitions (
  name,
  operational_definition,
  examples,
  non_examples,
  is_target_behavior,
  is_replacement_behavior,
  color,
  sort_order
)
values
  ('Tantrum', 'Crying/yelling lasting at least 10 seconds with refusal behavior.', 'Drops to floor, yells, cries loudly.', 'Whining under 10 seconds.', true, false, '#EF4444', 10),
  ('Aggression', 'Hitting, kicking, biting, or scratching directed at others.', 'Open-hand hit toward caregiver.', 'Accidental bump while playing.', true, false, '#DC2626', 20),
  ('Property Destruction', 'Throwing, breaking, or damaging objects.', 'Throws toy at wall.', 'Setting toy down forcefully but safely.', true, false, '#F97316', 30),
  ('Elopement', 'Leaving assigned area without permission for more than 3 seconds.', 'Runs from dining table to hallway.', 'Walking to the bathroom after being asked.', true, false, '#F59E0B', 40),
  ('Task Refusal', 'Not beginning a presented task within 10 seconds or verbally refusing.', 'Says "no" and turns away from worksheet.', 'Asking for help before starting.', true, false, '#3B82F6', 50),
  ('SIB', 'Any self-injurious behavior such as head hitting or self-biting.', 'Hits head with open hand repeatedly.', 'Adjusting hair or touching face.', true, false, '#B91C1C', 60),
  ('Verbal Protest', 'Loud verbal objections to demands, peers, or denied access.', 'Shouts "stop" repeatedly at parent.', 'Calmly asking for a break.', true, false, '#8B5CF6', 70),
  ('Transition Delay', 'Taking over 30 seconds to move to next activity after prompt.', 'Remains seated after 3 transition prompts.', 'Walking to next room after first prompt.', true, false, '#14B8A6', 80),
  ('Functional Communication', 'Appropriately requesting help, break, or item.', 'Uses phrase card to request break.', null, false, true, '#10B981', 90),
  ('Following Directions', 'Completes first instruction within 5 seconds.', 'Begins clean-up after one prompt.', null, false, true, '#22C55E', 100)
on conflict do nothing;
