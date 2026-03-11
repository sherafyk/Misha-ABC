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
