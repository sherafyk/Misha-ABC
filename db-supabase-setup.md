# Supabase Database Setup Guide

Below is the complete Supabase setup guide with SQL code and detailed instructions.


### Prerequisites

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Click **"New Project"**
3. Choose your organization (or create one)
4. Set:
   - **Project name**: `abc-tracker`
   - **Database password**: (save this securely — you won't need it in the app, but keep it)
   - **Region**: Choose closest to your location
5. Click **"Create new project"** and wait for provisioning (~2 minutes)
6. Once ready, go to **Settings → API** and copy:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 1: Run the Schema SQL

Go to **SQL Editor** in the Supabase dashboard (left sidebar), click **"New query"**, and paste the following SQL. Run it all at once.

```sql
-- ============================================================
-- ABC Behavior Tracker — Full Database Schema
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE behavior_function AS ENUM (
  'sensory', 'escape', 'attention', 'tangible', 'unknown'
);

CREATE TYPE behavior_severity AS ENUM (
  'low', 'medium', 'high', 'crisis'
);

CREATE TYPE incident_setting AS ENUM (
  'home', 'school', 'community', 'therapy', 'other'
);

CREATE TYPE consequence_type AS ENUM (
  'reinforcement_positive',
  'reinforcement_negative',
  'punishment_positive',
  'punishment_negative',
  'extinction',
  'redirection',
  'other'
);

CREATE TYPE ai_note_type AS ENUM (
  'incident', 'daily_summary', 'progress_report', 'general'
);

-- ============================================================
-- TABLE: child_profile (single row — one child)
-- ============================================================

CREATE TABLE child_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  date_of_birth DATE,
  diagnosis_notes TEXT,
  therapist_name TEXT,
  therapist_email TEXT,
  bcba_name TEXT,
  bcba_email TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_child_profile_updated_at
  BEFORE UPDATE ON child_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: behavior_definitions
-- ============================================================

CREATE TABLE behavior_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  operational_definition TEXT NOT NULL,
  examples TEXT,
  non_examples TEXT,
  is_target_behavior BOOLEAN DEFAULT TRUE,
  is_replacement_behavior BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_behavior_definitions_active ON behavior_definitions(is_active);

-- ============================================================
-- TABLE: antecedent_options
-- ============================================================

CREATE TABLE antecedent_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  is_custom BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_antecedent_options_active ON antecedent_options(is_active);

-- ============================================================
-- TABLE: consequence_options
-- ============================================================

CREATE TABLE consequence_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  type consequence_type NOT NULL DEFAULT 'other',
  is_custom BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consequence_options_active ON consequence_options(is_active);

-- ============================================================
-- TABLE: incidents (core ABC data)
-- ============================================================

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER,
  setting incident_setting NOT NULL DEFAULT 'home',
  setting_detail TEXT,
  
  -- Behavior
  behavior_id UUID NOT NULL REFERENCES behavior_definitions(id) ON DELETE RESTRICT,
  behavior_notes TEXT,
  severity behavior_severity NOT NULL DEFAULT 'medium',
  
  -- Antecedent (notes — linked antecedents in junction table)
  antecedent_notes TEXT,
  
  -- Consequence (notes — linked consequences in junction table)
  consequence_notes TEXT,
  
  -- Analysis
  hypothesized_function behavior_function DEFAULT 'unknown',
  
  -- Context
  people_present TEXT,
  environmental_factors TEXT,
  mood_before TEXT,
  
  -- Notes
  parent_raw_notes TEXT,
  ai_formatted_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Performance indexes
CREATE INDEX idx_incidents_occurred_at ON incidents(occurred_at DESC);
CREATE INDEX idx_incidents_behavior_id ON incidents(behavior_id);
CREATE INDEX idx_incidents_setting ON incidents(setting);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_function ON incidents(hypothesized_function);
CREATE INDEX idx_incidents_date ON incidents(DATE(occurred_at));

-- ============================================================
-- JUNCTION TABLE: incident_antecedents
-- ============================================================

CREATE TABLE incident_antecedents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  antecedent_id UUID NOT NULL REFERENCES antecedent_options(id) ON DELETE CASCADE,
  UNIQUE(incident_id, antecedent_id)
);

CREATE INDEX idx_incident_antecedents_incident ON incident_antecedents(incident_id);
CREATE INDEX idx_incident_antecedents_antecedent ON incident_antecedents(antecedent_id);

-- ============================================================
-- JUNCTION TABLE: incident_consequences
-- ============================================================

CREATE TABLE incident_consequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  consequence_id UUID NOT NULL REFERENCES consequence_options(id) ON DELETE CASCADE,
  UNIQUE(incident_id, consequence_id)
);

CREATE INDEX idx_incident_consequences_incident ON incident_consequences(incident_id);
CREATE INDEX idx_incident_consequences_consequence ON incident_consequences(consequence_id);

-- ============================================================
-- TABLE: daily_logs
-- ============================================================

CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_date DATE NOT NULL UNIQUE,
  overall_mood TEXT,
  sleep_quality TEXT,
  sleep_hours NUMERIC(4,2),
  medication_given BOOLEAN DEFAULT FALSE,
  medication_notes TEXT,
  diet_notes TEXT,
  general_notes TEXT,
  ai_formatted_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_daily_logs_date ON daily_logs(log_date DESC);

-- ============================================================
-- TABLE: ai_notes
-- ============================================================

CREATE TABLE ai_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  daily_log_id UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
  raw_input TEXT NOT NULL,
  formatted_output TEXT NOT NULL,
  note_type ai_note_type NOT NULL DEFAULT 'general',
  model_used TEXT DEFAULT 'gpt-4o',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_notes_incident ON ai_notes(incident_id);
CREATE INDEX idx_ai_notes_daily_log ON ai_notes(daily_log_id);
CREATE INDEX idx_ai_notes_type ON ai_notes(note_type);
CREATE INDEX idx_ai_notes_created ON ai_notes(created_at DESC);

-- ============================================================
-- VIEWS: Useful pre-built queries
-- ============================================================

-- View: Incidents with behavior names (most common query)
CREATE VIEW incidents_with_behavior AS
SELECT
  i.*,
  bd.name AS behavior_name,
  bd.operational_definition AS behavior_definition,
  bd.color AS behavior_color,
  bd.is_target_behavior,
  bd.is_replacement_behavior
FROM incidents i
JOIN behavior_definitions bd ON i.behavior_id = bd.id
ORDER BY i.occurred_at DESC;

-- View: Daily incident summary
CREATE VIEW daily_incident_summary AS
SELECT
  DATE(occurred_at) AS incident_date,
  COUNT(*) AS total_incidents,
  COUNT(*) FILTER (WHERE severity = 'crisis') AS crisis_count,
  COUNT(*) FILTER (WHERE severity = 'high') AS high_count,
  COUNT(*) FILTER (WHERE severity = 'medium') AS medium_count,
  COUNT(*) FILTER (WHERE severity = 'low') AS low_count,
  COUNT(*) FILTER (WHERE hypothesized_function = 'sensory') AS sensory_count,
  COUNT(*) FILTER (WHERE hypothesized_function = 'escape') AS escape_count,
  COUNT(*) FILTER (WHERE hypothesized_function = 'attention') AS attention_count,
  COUNT(*) FILTER (WHERE hypothesized_function = 'tangible') AS tangible_count,
  MODE() WITHIN GROUP (ORDER BY setting) AS most_common_setting,
  MODE() WITHIN GROUP (ORDER BY severity) AS most_common_severity
FROM incidents
GROUP BY DATE(occurred_at)
ORDER BY incident_date DESC;

-- View: Behavior frequency ranking
CREATE VIEW behavior_frequency AS
SELECT
  bd.id,
  bd.name,
  bd.color,
  bd.is_target_behavior,
  COUNT(i.id) AS total_incidents,
  COUNT(i.id) FILTER (WHERE i.occurred_at >= NOW() - INTERVAL '7 days') AS last_7_days,
  COUNT(i.id) FILTER (WHERE i.occurred_at >= NOW() - INTERVAL '30 days') AS last_30_days,
  ROUND(AVG(CASE
    WHEN i.severity = 'low' THEN 1
    WHEN i.severity = 'medium' THEN 2
    WHEN i.severity = 'high' THEN 3
    WHEN i.severity = 'crisis' THEN 4
  END), 2) AS avg_severity_score
FROM behavior_definitions bd
LEFT JOIN incidents i ON bd.id = i.behavior_id
WHERE bd.is_active = TRUE
GROUP BY bd.id, bd.name, bd.color, bd.is_target_behavior
ORDER BY total_incidents DESC;

-- View: Antecedent frequency
CREATE VIEW antecedent_frequency AS
SELECT
  ao.id,
  ao.label,
  ao.category,
  COUNT(ia.id) AS times_recorded,
  COUNT(ia.id) FILTER (WHERE i.occurred_at >= NOW() - INTERVAL '30 days') AS last_30_days
FROM antecedent_options ao
LEFT JOIN incident_antecedents ia ON ao.id = ia.antecedent_id
LEFT JOIN incidents i ON ia.incident_id = i.id
WHERE ao.is_active = TRUE
GROUP BY ao.id, ao.label, ao.category
ORDER BY times_recorded DESC;

-- View: Consequence frequency
CREATE VIEW consequence_frequency AS
SELECT
  co.id,
  co.label,
  co.type,
  COUNT(ic.id) AS times_recorded,
  COUNT(ic.id) FILTER (WHERE i.occurred_at >= NOW() - INTERVAL '30 days') AS last_30_days
FROM consequence_options co
LEFT JOIN incident_consequences ic ON co.id = ic.consequence_id
LEFT JOIN incidents i ON ic.incident_id = i.id
WHERE co.is_active = TRUE
GROUP BY co.id, co.label, co.type
ORDER BY times_recorded DESC;

-- View: ABC Pattern chains (for pattern analysis)
CREATE VIEW abc_patterns AS
SELECT
  ao.label AS antecedent,
  bd.name AS behavior,
  co.label AS consequence,
  i.hypothesized_function AS function,
  COUNT(*) AS occurrence_count
FROM incidents i
JOIN behavior_definitions bd ON i.behavior_id = bd.id
JOIN incident_antecedents ia ON i.id = ia.incident_id
JOIN antecedent_options ao ON ia.antecedent_id = ao.id
JOIN incident_consequences ic ON i.id = ic.incident_id
JOIN consequence_options co ON ic.consequence_id = co.id
GROUP BY ao.label, bd.name, co.label, i.hypothesized_function
HAVING COUNT(*) >= 2
ORDER BY occurrence_count DESC;

-- ============================================================
-- RPC FUNCTIONS: Complex queries as Supabase functions
-- ============================================================

-- Function: Get incidents for a date range with all related data
CREATE OR REPLACE FUNCTION get_incidents_with_details(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  id UUID,
  occurred_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  setting incident_setting,
  setting_detail TEXT,
  behavior_id UUID,
  behavior_name TEXT,
  behavior_color TEXT,
  behavior_notes TEXT,
  severity behavior_severity,
  antecedent_notes TEXT,
  consequence_notes TEXT,
  hypothesized_function behavior_function,
  people_present TEXT,
  environmental_factors TEXT,
  mood_before TEXT,
  parent_raw_notes TEXT,
  ai_formatted_notes TEXT,
  created_at TIMESTAMPTZ,
  antecedent_labels TEXT[],
  consequence_labels TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.occurred_at,
    i.duration_seconds,
    i.setting,
    i.setting_detail,
    i.behavior_id,
    bd.name AS behavior_name,
    bd.color AS behavior_color,
    i.behavior_notes,
    i.severity,
    i.antecedent_notes,
    i.consequence_notes,
    i.hypothesized_function,
    i.people_present,
    i.environmental_factors,
    i.mood_before,
    i.parent_raw_notes,
    i.ai_formatted_notes,
    i.created_at,
    ARRAY(
      SELECT ao.label
      FROM incident_antecedents ia
      JOIN antecedent_options ao ON ia.antecedent_id = ao.id
      WHERE ia.incident_id = i.id
    ) AS antecedent_labels,
    ARRAY(
      SELECT co.label
      FROM incident_consequences ic
      JOIN consequence_options co ON ic.consequence_id = co.id
      WHERE ic.incident_id = i.id
    ) AS consequence_labels
  FROM incidents i
  JOIN behavior_definitions bd ON i.behavior_id = bd.id
  WHERE i.occurred_at BETWEEN start_date AND end_date
  ORDER BY i.occurred_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get hourly distribution of incidents (for heatmap)
CREATE OR REPLACE FUNCTION get_hourly_distribution(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  hour_of_day INTEGER,
  day_of_week INTEGER,
  incident_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM occurred_at)::INTEGER AS hour_of_day,
    EXTRACT(DOW FROM occurred_at)::INTEGER AS day_of_week,
    COUNT(*) AS incident_count
  FROM incidents
  WHERE occurred_at BETWEEN start_date AND end_date
  GROUP BY hour_of_day, day_of_week
  ORDER BY day_of_week, hour_of_day;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Since there's no auth, we use permissive policies
-- that allow all operations with the anon key.
-- For a single-family app this is acceptable.
-- ============================================================

ALTER TABLE child_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE antecedent_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE consequence_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_antecedents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_consequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_notes ENABLE ROW LEVEL SECURITY;

-- Permissive policies for anon access (no auth required)
CREATE POLICY "Allow all access to child_profile" ON child_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to behavior_definitions" ON behavior_definitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to antecedent_options" ON antecedent_options FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to consequence_options" ON consequence_options FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to incidents" ON incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to incident_antecedents" ON incident_antecedents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to incident_consequences" ON incident_consequences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to daily_logs" ON daily_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to ai_notes" ON ai_notes FOR ALL USING (true) WITH CHECK (true);
```

### Step 2: Seed Default Data

After the schema is created, run this second query to populate default antecedents, consequences, and sample behaviors:

```sql
-- ============================================================
-- SEED DATA: Default antecedent options
-- ============================================================

INSERT INTO antecedent_options (label, category, is_custom, sort_order) VALUES
  ('Asked to transition between activities', 'transition', FALSE, 1),
  ('Given a demand or instruction', 'demand', FALSE, 2),
  ('Preferred item or activity removed', 'demand', FALSE, 3),
  ('Told "no" or denied a request', 'demand', FALSE, 4),
  ('Change in routine or schedule', 'routine_change', FALSE, 5),
  ('Unstructured or free time', 'environmental', FALSE, 6),
  ('Loud or overwhelming environment', 'environmental', FALSE, 7),
  ('Peer interaction or social conflict', 'social', FALSE, 8),
  ('Left alone or attention withdrawn', 'social', FALSE, 9),
  ('New person or unfamiliar setting', 'social', FALSE, 10),
  ('Hunger, thirst, or fatigue', 'physiological', FALSE, 11),
  ('Waiting or delayed reinforcement', 'demand', FALSE, 12),
  ('Difficult or non-preferred task presented', 'demand', FALSE, 13),
  ('Sensory input (light, sound, texture, smell)', 'environmental', FALSE, 14),
  ('Preferred activity available to others but not child', 'social', FALSE, 15),
  ('Unexpected event or surprise', 'routine_change', FALSE, 16),
  ('Morning routine (getting ready)', 'transition', FALSE, 17),
  ('Bedtime routine', 'transition', FALSE, 18),
  ('Mealtime', 'transition', FALSE, 19),
  ('Homework or academic task', 'demand', FALSE, 20);

-- ============================================================
-- SEED DATA: Default consequence options
-- ============================================================

INSERT INTO consequence_options (label, type, is_custom, sort_order) VALUES
  ('Verbal reprimand given', 'punishment_positive', FALSE, 1),
  ('Attention provided (comfort, discussion)', 'reinforcement_positive', FALSE, 2),
  ('Demand removed or delayed', 'reinforcement_negative', FALSE, 3),
  ('Preferred item or activity given', 'reinforcement_positive', FALSE, 4),
  ('Planned ignoring (extinction)', 'extinction', FALSE, 5),
  ('Redirected to alternative activity', 'redirection', FALSE, 6),
  ('Physical prompt or guidance provided', 'other', FALSE, 7),
  ('Time out or removal from environment', 'punishment_negative', FALSE, 8),
  ('Natural consequence occurred', 'other', FALSE, 9),
  ('Visual or verbal cue provided', 'redirection', FALSE, 10),
  ('Break offered', 'reinforcement_negative', FALSE, 11),
  ('Praise given for replacement behavior', 'reinforcement_positive', FALSE, 12),
  ('Counted / gave verbal warning', 'other', FALSE, 13),
  ('Peer responded (positively or negatively)', 'other', FALSE, 14),
  ('Token or reward earned', 'reinforcement_positive', FALSE, 15),
  ('Privilege removed or threatened', 'punishment_negative', FALSE, 16),
  ('Task modified or simplified', 'reinforcement_negative', FALSE, 17),
  ('Choice offered between alternatives', 'redirection', FALSE, 18);

-- ============================================================
-- SEED DATA: Common ASD behavior definitions
-- ============================================================

INSERT INTO behavior_definitions (name, operational_definition, examples, non_examples, is_target_behavior, is_replacement_behavior, color, sort_order) VALUES
  (
    'Aggression',
    'Any instance of making forceful physical contact with another person''s body or belongings, including but not limited to hitting, kicking, biting, scratching, pushing, or throwing objects at others.',
    'Hitting parent with open hand; kicking sibling; biting therapist arm; throwing toy at peer',
    'Accidentally bumping into someone; gentle tapping to get attention; high-fives',
    TRUE, FALSE, '#EF4444', 1
  ),
  (
    'Self-Injurious Behavior (SIB)',
    'Any instance of the child making forceful contact with their own body that has the potential to cause tissue damage, including head-banging, self-biting, self-hitting, or skin-picking.',
    'Banging head against wall; biting own hand; hitting own head with fist; picking skin until bleeding',
    'Scratching a mosquito bite; rubbing eyes when tired',
    TRUE, FALSE, '#DC2626', 2
  ),
  (
    'Elopement',
    'Any instance of the child leaving or attempting to leave a designated area or a supervising adult''s proximity without permission.',
    'Running out of the classroom; leaving the yard without permission; bolting in a parking lot; leaving the table during meals',
    'Walking to the bathroom with permission; moving to a different area when directed',
    TRUE, FALSE, '#F97316', 3
  ),
  (
    'Tantrum / Meltdown',
    'A sustained episode (lasting more than 30 seconds) involving two or more of the following: crying, screaming, falling to the floor, flailing limbs, or verbal protests, occurring simultaneously or in rapid succession.',
    'Screaming and crying on the floor for 5 minutes; yelling "NO!" while stomping feet and flailing arms',
    'Brief whining that stops within 10 seconds; a single verbal protest without escalation',
    TRUE, FALSE, '#F59E0B', 4
  ),
  (
    'Noncompliance / Task Refusal',
    'Any instance of the child failing to initiate a requested action within 10 seconds of being given a directive, or verbally or physically indicating refusal to comply with an instruction.',
    'Saying "no" when asked to clean up; ignoring repeated instructions; pushing materials away when presented with a task',
    'Asking for help with a task; requesting a break appropriately; not responding due to not hearing the instruction',
    TRUE, FALSE, '#8B5CF6', 5
  ),
  (
    'Stereotypy / Stimming',
    'Repetitive, non-functional motor movements or vocalizations that do not serve an apparent social or communicative purpose.',
    'Hand-flapping; body rocking; spinning objects; repeating phrases (echolalia); finger-flicking',
    'Waving hello; rocking in a rocking chair; humming a song with lyrics',
    TRUE, FALSE, '#6366F1', 6
  ),
  (
    'Property Destruction',
    'Any instance of the child causing damage or attempting to cause damage to objects, materials, or property that does not belong to them, or using objects in a way that could cause damage.',
    'Throwing and breaking a plate; ripping papers; slamming doors; sweeping items off a table',
    'Dropping something accidentally; normal wear and tear from use',
    TRUE, FALSE, '#EC4899', 7
  ),
  (
    'Screaming / Vocal Protest',
    'Any vocalization above normal conversational volume that is not communicative in nature, lasting more than 3 seconds.',
    'Screaming "AAAAH!" loudly; shrieking; sustained yelling without words',
    'Calling out to get someone''s attention appropriately; cheering during play; answering loudly in a noisy environment',
    TRUE, FALSE, '#D946EF', 8
  ),
  (
    'Appropriate Request (Mand)',
    'Any instance of the child using words, signs, pictures, or an AAC device to appropriately request a desired item, activity, or break.',
    'Saying "break please"; using a PECS card to request a snack; signing "more"; typing "I want iPad" on AAC device',
    'Screaming for an item; grabbing an item from someone; tantruming until given a preferred item',
    FALSE, TRUE, '#22C55E', 9
  ),
  (
    'Appropriate Waiting',
    'Any instance of the child remaining in a designated area and refraining from problem behavior for a specified waiting period after being told to wait.',
    'Sitting in chair for 2 minutes while waiting for a turn; standing in line without pushing; waiting for food without screaming',
    'Waiting while engaging in stereotypy that disrupts others; waiting while whining continuously',
    FALSE, TRUE, '#14B8A6', 10
  );
```

### Step 3: Verify the Setup

Run these verification queries one at a time:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Should return:
-- ai_notes
-- antecedent_options
-- behavior_definitions
-- child_profile
-- consequence_options
-- daily_logs
-- incident_antecedents
-- incident_consequences
-- incidents

-- Check seed data
SELECT COUNT(*) AS antecedent_count FROM antecedent_options;
-- Should return: 20

SELECT COUNT(*) AS consequence_count FROM consequence_options;
-- Should return: 18

SELECT COUNT(*) AS behavior_count FROM behavior_definitions;
-- Should return: 10

-- Check views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return:
-- abc_patterns
-- antecedent_frequency
-- behavior_frequency
-- consequence_frequency
-- daily_incident_summary
-- incidents_with_behavior

-- Check RPC functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
AND routine_name LIKE 'get_%';

-- Should return:
-- get_hourly_distribution
-- get_incidents_with_details

-- Test the RLS policies are permissive
SELECT * FROM antecedent_options LIMIT 3;
-- Should return 3 rows without authentication errors
```

### Step 4: Configure Supabase Dashboard Settings

1. **Go to Settings → API**:
   - Copy the **Project URL** and **anon key** into your `.env.local` file

2. **Go to Authentication → Settings**:
   - Since we're not using auth, no changes needed here
   - But ensure the **anon** key has the correct permissions

3. **Go to Database → Replication** (optional):
   - Enable realtime for the `incidents` table if you want live updates across tabs/devices:
     ```
     Table: incidents → Toggle ON
     Table: daily_logs → Toggle ON
     ```

4. **Go to Storage** (optional, for child photo):
   - Create a new bucket called `avatars`
   - Set it to **Public**
   - Add policy: allow all uploads for anon users

### Step 5: Test with a Sample Incident

Run this to verify the full data flow works:

```sql
-- First, create the child profile
INSERT INTO child_profile (first_name, last_name, date_of_birth)
VALUES ('Alex', 'Smith', '2019-06-15');

-- Insert a test incident
INSERT INTO incidents (
  occurred_at,
  duration_seconds,
  setting,
  setting_detail,
  behavior_id,
  behavior_notes,
  severity,
  antecedent_notes,
  consequence_notes,
  hypothesized_function,
  people_present,
  mood_before,
  parent_raw_notes
) VALUES (
  NOW(),
  120,
  'home',
  'Living room',
  (SELECT id FROM behavior_definitions WHERE name = 'Tantrum / Meltdown'),
  'Fell to the floor crying and screaming, lasted about 2 minutes',
  'high',
  'Was asked to turn off the iPad and come to dinner',
  'I told him we could use the iPad after dinner, then physically guided him to the table',
  'escape',
  'Mom, Dad, older sister',
  'Irritable',
  'He had been on the iPad for about 30 minutes playing his favorite game. When I told him dinner was ready and he needed to stop, he immediately threw himself on the ground screaming. This is the 3rd time this week during iPad-to-dinner transition. He eventually calmed down after I promised iPad time after dinner but it took a while. Im worried this is becoming a pattern.'
);

-- Link antecedents to the incident
INSERT INTO incident_antecedents (incident_id, antecedent_id)
SELECT
  (SELECT id FROM incidents ORDER BY created_at DESC LIMIT 1),
  id
FROM antecedent_options
WHERE label IN (
  'Asked to transition between activities',
  'Preferred item or activity removed',
  'Difficult or non-preferred task presented'
);

-- Link consequences
INSERT INTO incident_consequences (incident_id, consequence_id)
SELECT
  (SELECT id FROM incidents ORDER BY created_at DESC LIMIT 1),
  id
FROM consequence_options
WHERE label IN (
  'Preferred item or activity given',
  'Physical prompt or guidance provided',
  'Demand removed or delayed'
);

-- Verify the full incident with details
SELECT * FROM incidents_with_behavior LIMIT 1;

-- Verify the test incident shows up in the details function
SELECT * FROM get_incidents_with_details(NOW() - INTERVAL '1 day', NOW());
```

### Step 6: Clean Up Test Data (Optional)

If you want to remove the test data before going live:

```sql
-- Remove test incident and related data (cascades handle junction tables)
DELETE FROM incidents;

-- Keep or remove the test child profile
-- DELETE FROM child_profile;
-- (You'll re-create this through the app's settings page)
```

---

### Summary of What You've Set Up

| Component | Count | Purpose |
|---|---|---|
| Tables | 9 | Core data storage for all ABC tracking |
| Views | 6 | Pre-built queries for reports and analytics |
| RPC Functions | 2 | Complex queries for incident details and heatmap data |
| Indexes | 14 | Performance optimization for common query patterns |
| RLS Policies | 9 | Permissive access (no auth, single-family use) |
| Default Antecedents | 20 | Pre-populated common behavioral triggers [[1]](file://ABC ABA behavior data dump.txt) |
| Default Consequences | 18 | Pre-populated common behavioral responses [[1]](file://ABC ABA behavior data dump.txt) |
| Behavior Definitions | 10 | 8 target behaviors + 2 replacement behaviors [[2]](https://www.bluejayaba.com/blog/abc-data-sheet) [[3]](https://www.hiddengemsaba.com/articles/abc-data-collection) |
| Triggers | 3 | Auto-update `updated_at` timestamps |

Your Supabase database is now fully configured and ready for the Next.js application to connect to it. The seed data is based on established ABA/ABC frameworks for tracking behavioral antecedents, behaviors, and consequences as described in Applied Behavior Analysis literature [[1]](file://ABC ABA behavior data dump.txt) [[4]](https://www.discoveryaba.com/aba-therapy/abc-data-collection) [[5]](https://www.mastermindbehavior.com/post/the-role-of-data-collection-in-aba-therapy-for-autism).


s Services in Children With Autism Spectrum Disorder - PMC**. [https://pmc.ncbi.nlm.nih.gov](https://pmc.ncbi.nlm.nih.gov/articles/PMC10710535/)
