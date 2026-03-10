# AGENTS.md — ABC Behavior Tracker: Full Build Plan for AI Agents

## PROJECT OVERVIEW

Build a single-child ABC (Antecedent-Behavior-Consequence) behavior tracking web application
for parents/caregivers of a child receiving ABA (Applied Behavior Analysis) therapy services.

### Core Purpose
This app enables parents to log behavioral incidents using the ABC framework used in ABA therapy:
- **Antecedent**: What happened before the behavior (trigger/environment/context)
- **Behavior**: The observable action the child exhibited
- **Consequence**: What happened after the behavior (response from environment/people)
- **Function**: The hypothesized purpose of the behavior (Sensory, Escape, Attention, Tangible)

The app includes AI features that take raw parent notes and reformat them into
clinical/provider-friendly language suitable for BCBAs, RBTs, and therapy teams.

### Design Philosophy
- No authentication or login — single-child, single-family use
- Sleek, intuitive, mobile-first, elegant UI (think: premium health app)
- Speed-optimized for quick logging during or immediately after incidents
- Data-rich: charts, trends, pattern detection, exportable reports
- AI-powered: natural language → structured clinical notes

### Tech Stack
- **Framework**: Next.js 14+ (App Router, Server Components)
- **Styling**: Tailwind CSS 3.4+ with shadcn/ui component library
- **Database**: Supabase (PostgreSQL + Realtime + Edge Functions)
- **AI Integration**: OpenAI API (GPT-4o) via server-side route handlers
- **Charts**: Recharts
- **Deployment**: Vercel
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode)

---

## STEP 1: Project Scaffolding & Configuration

### Goal
Initialize the Next.js project with all dependencies, TypeScript config, Tailwind, shadcn/ui,
and environment variable structure.

### Tasks
1. Run `pnpm create next-app@latest abc-tracker --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. `cd abc-tracker`
3. Install core dependencies:
   ```bash
   pnpm add @supabase/supabase-js @supabase/ssr recharts date-fns lucide-react openai zod react-hook-form @hookform/resolvers class-variance-authority clsx tailwind-merge
   ```
4. Install dev dependencies:
   ```bash
   pnpm add -D @types/node @types/react @types/react-dom
   ```
5. Initialize shadcn/ui:
   ```bash
   pnpm dlx shadcn-ui@latest init
   ```
   - Style: Default
   - Base color: Slate
   - CSS variables: Yes
6. Install shadcn/ui components:
   ```bash
   pnpm dlx shadcn-ui@latest add button card input label textarea select badge dialog sheet tabs separator scroll-area tooltip popover calendar dropdown-menu command toast sonner alert-dialog switch toggle-group avatar checkbox radio-group form table
   ```
7. Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```
8. Create `/src/lib/supabase/client.ts` — browser Supabase client:
   ```typescript
   import { createBrowserClient } from '@supabase/ssr'

   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     )
   }
   ```
9. Create `/src/lib/supabase/server.ts` — server-side Supabase client:
   ```typescript
   import { createServerClient } from '@supabase/ssr'
   import { cookies } from 'next/headers'

   export async function createClient() {
     const cookieStore = await cookies()
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() { return cookieStore.getAll() },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                 cookieStore.set(name, value, options)
               )
             } catch {}
           },
         },
       }
     )
   }
   ```
10. Create `/src/lib/utils.ts` with `cn()` helper (should already exist from shadcn init).
11. Update `tailwind.config.ts` to include a custom color palette:
    - Primary: a calming blue (#3B82F6 range)
    - Accent: soft teal (#14B8A6 range)
    - Warning: warm amber for alerts
    - Destructive: soft red for problem behaviors
    - Background: clean white/near-white
12. Create folder structure:
    ```
    src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── incidents/
    │   │   ├── page.tsx
    │   │   └── [id]/
    │   │       └── page.tsx
    │   ├── log/
    │   │   └── page.tsx
    │   ├── reports/
    │   │   └── page.tsx
    │   ├── settings/
    │   │   └── page.tsx
    │   ├── ai-notes/
    │   │   └── page.tsx
    │   └── api/
    │       ├── ai/
    │       │   ├── format-note/
    │       │   │   └── route.ts
    │       │   ├── generate-summary/
    │       │   │   └── route.ts
    │       │   └── suggest-function/
    │       │       └── route.ts
    │       └── export/
    │           └── route.ts
    ├── components/
    │   ├── layout/
    │   ├── forms/
    │   ├── charts/
    │   ├── cards/
    │   └── ui/ (shadcn)
    ├── lib/
    │   ├── supabase/
    │   ├── types/
    │   ├── constants/
    │   ├── hooks/
    │   └── utils.ts
    └── styles/
    ```

### Completion Criteria
- `pnpm dev` runs without errors
- shadcn/ui components render correctly
- Supabase client files exist (will connect after DB setup)
- Folder structure is in place with placeholder files

---

## STEP 2: TypeScript Types & Constants

### Goal
Define all TypeScript types, enums, and constant values that map to the ABC/ABA framework.

### Tasks
1. Create `/src/lib/types/database.ts`:
   ```typescript
   export type BehaviorFunction = 'sensory' | 'escape' | 'attention' | 'tangible' | 'unknown'
   export type BehaviorSeverity = 'low' | 'medium' | 'high' | 'crisis'
   export type IncidentSetting = 'home' | 'school' | 'community' | 'therapy' | 'other'
   export type ConsequenceType = 'reinforcement_positive' | 'reinforcement_negative' | 'punishment_positive' | 'punishment_negative' | 'extinction' | 'redirection' | 'other'

   export interface ChildProfile {
     id: string
     first_name: string
     last_name: string
     date_of_birth: string
     diagnosis_notes: string | null
     therapist_name: string | null
     therapist_email: string | null
     bcba_name: string | null
     bcba_email: string | null
     created_at: string
     updated_at: string
   }

   export interface BehaviorDefinition {
     id: string
     name: string
     operational_definition: string
     examples: string | null
     non_examples: string | null
     is_target_behavior: boolean
     is_replacement_behavior: boolean
     color: string
     icon: string | null
     created_at: string
   }

   export interface AntecedentOption {
     id: string
     label: string
     category: string // e.g., 'demand', 'transition', 'social', 'environmental', 'routine_change'
     is_custom: boolean
     created_at: string
   }

   export interface ConsequenceOption {
     id: string
     label: string
     type: ConsequenceType
     is_custom: boolean
     created_at: string
   }

   export interface Incident {
     id: string
     occurred_at: string
     duration_seconds: number | null
     setting: IncidentSetting
     setting_detail: string | null
     antecedent_ids: string[]
     antecedent_notes: string | null
     behavior_id: string
     behavior_notes: string | null
     severity: BehaviorSeverity
     consequence_ids: string[]
     consequence_notes: string | null
     hypothesized_function: BehaviorFunction
     parent_raw_notes: string | null
     ai_formatted_notes: string | null
     people_present: string | null
     environmental_factors: string | null
     mood_before: string | null
     created_at: string
     updated_at: string
     // Joined
     behavior?: BehaviorDefinition
     antecedents?: AntecedentOption[]
     consequences?: ConsequenceOption[]
   }

   export interface DailyLog {
     id: string
     log_date: string
     overall_mood: string | null
     sleep_quality: string | null
     sleep_hours: number | null
     medication_given: boolean
     medication_notes: string | null
     diet_notes: string | null
     general_notes: string | null
     ai_formatted_summary: string | null
     created_at: string
     updated_at: string
   }

   export interface AINote {
     id: string
     incident_id: string | null
     daily_log_id: string | null
     raw_input: string
     formatted_output: string
     note_type: 'incident' | 'daily_summary' | 'progress_report' | 'general'
     created_at: string
   }
   ```

2. Create `/src/lib/constants/abc-options.ts`:
   ```typescript
   export const DEFAULT_ANTECEDENTS = [
     { label: 'Asked to transition between activities', category: 'transition' },
     { label: 'Given a demand or instruction', category: 'demand' },
     { label: 'Preferred item/activity removed', category: 'demand' },
     { label: 'Told "no" or denied request', category: 'demand' },
     { label: 'Change in routine', category: 'routine_change' },
     { label: 'Unstructured/free time', category: 'environmental' },
     { label: 'Loud or overwhelming environment', category: 'environmental' },
     { label: 'Peer interaction/conflict', category: 'social' },
     { label: 'Left alone / attention withdrawn', category: 'social' },
     { label: 'New person or unfamiliar setting', category: 'social' },
     { label: 'Hunger or fatigue', category: 'physiological' },
     { label: 'Waiting / delayed reinforcement', category: 'demand' },
     { label: 'Difficult or non-preferred task', category: 'demand' },
     { label: 'Sensory input (light, sound, texture)', category: 'environmental' },
   ]

   export const DEFAULT_CONSEQUENCES = [
     { label: 'Verbal reprimand given', type: 'punishment_positive' },
     { label: 'Attention provided (comfort, discussion)', type: 'reinforcement_positive' },
     { label: 'Demand removed or delayed', type: 'reinforcement_negative' },
     { label: 'Preferred item/activity given', type: 'reinforcement_positive' },
     { label: 'Planned ignoring (extinction)', type: 'extinction' },
     { label: 'Redirected to alternative activity', type: 'redirection' },
     { label: 'Physical prompt or guidance', type: 'other' },
     { label: 'Time out / removal from environment', type: 'punishment_negative' },
     { label: 'Natural consequence occurred', type: 'other' },
     { label: 'Visual/verbal cue provided', type: 'redirection' },
     { label: 'Break offered', type: 'reinforcement_negative' },
     { label: 'Praise for replacement behavior', type: 'reinforcement_positive' },
   ]

   export const BEHAVIOR_FUNCTIONS = [
     { value: 'sensory', label: 'Sensory / Automatic', description: 'Behavior provides internal sensory stimulation', color: '#8B5CF6' },
     { value: 'escape', label: 'Escape / Avoidance', description: 'Behavior allows avoidance or removal of a demand, task, or situation', color: '#F59E0B' },
     { value: 'attention', label: 'Attention', description: 'Behavior results in social attention from others', color: '#3B82F6' },
     { value: 'tangible', label: 'Tangible / Access', description: 'Behavior results in access to a preferred item or activity', color: '#10B981' },
     { value: 'unknown', label: 'Unknown / Uncertain', description: 'Function not yet determined', color: '#6B7280' },
   ]

   export const SEVERITY_LEVELS = [
     { value: 'low', label: 'Low', description: 'Minimal disruption, easily redirected', color: '#22C55E' },
     { value: 'medium', label: 'Medium', description: 'Moderate disruption, requires intervention', color: '#F59E0B' },
     { value: 'high', label: 'High', description: 'Significant disruption, difficult to redirect', color: '#F97316' },
     { value: 'crisis', label: 'Crisis', description: 'Safety concern, immediate intervention required', color: '#EF4444' },
   ]

   export const SETTINGS = [
     { value: 'home', label: 'Home' },
     { value: 'school', label: 'School' },
     { value: 'community', label: 'Community' },
     { value: 'therapy', label: 'Therapy' },
     { value: 'other', label: 'Other' },
   ]

   export const MOOD_OPTIONS = ['Happy', 'Calm', 'Anxious', 'Irritable', 'Tired', 'Energetic', 'Sad', 'Neutral']
   ```

### Completion Criteria
- All types compile without errors
- Constants are comprehensive and based on ABA framework
- Types match the Supabase schema (defined in Deliverable 2)

---

## STEP 3: App Layout & Navigation

### Goal
Build the global layout shell with bottom tab navigation (mobile) and sidebar navigation (desktop).
The design should feel like a premium health/wellness app — clean, calm, intuitive.

### Tasks
1. Create `/src/components/layout/app-shell.tsx`:
   - Responsive layout: sidebar on desktop (≥768px), bottom tabs on mobile
   - Five navigation items:
     - **Dashboard** (Home icon) — `/`
     - **Log Incident** (Plus Circle icon) — `/log` — This should be visually prominent (accent color, larger)
     - **History** (List icon) — `/incidents`
     - **Reports** (BarChart3 icon) — `/reports`
     - **Settings** (Settings icon) — `/settings`
   - Use Lucide React icons
   - Active state with color highlight and subtle animation

2. Create `/src/components/layout/top-bar.tsx`:
   - Shows child's first name and current date
   - Quick-log button (floating action button on mobile)
   - Clean, minimal header

3. Update `/src/app/layout.tsx`:
   - Import and wrap with AppShell
   - Set metadata: title "ABC Tracker", description
   - Apply global font (Inter via next/font)
   - Include Toaster from sonner for notifications
   - Set viewport for mobile optimization

4. Style requirements:
   - Background: `bg-slate-50` (light mode only for v1)
   - Cards: white with subtle shadows, rounded-xl
   - Typography: clean hierarchy, good contrast
   - Spacing: generous padding, breathing room
   - Transitions: subtle hover/active states (150ms)
   - Mobile: full-width cards, thumb-friendly tap targets (min 44px)

### Completion Criteria
- Navigation renders on all screen sizes
- Active route is highlighted
- Layout is visually polished and feels professional
- Log Incident button is prominently accessible from any page

---

## STEP 4: Supabase Client Hooks & Data Layer

### Goal
Create custom React hooks for all CRUD operations against Supabase. These hooks will be the
data layer for the entire application.

### Tasks
1. Create `/src/lib/hooks/use-child-profile.ts`:
   - `useChildProfile()` — fetch the single child profile
   - `useUpdateChildProfile(data)` — upsert child profile
   - Uses SWR-like pattern with React state + useEffect, or a lightweight fetching approach

2. Create `/src/lib/hooks/use-behaviors.ts`:
   - `useBehaviors()` — fetch all behavior definitions
   - `useCreateBehavior(data)` — insert new behavior
   - `useUpdateBehavior(id, data)` — update existing
   - `useDeleteBehavior(id)` — soft delete or remove

3. Create `/src/lib/hooks/use-incidents.ts`:
   - `useIncidents(filters?)` — fetch incidents with optional filters (date range, behavior, setting, function, severity)
   - `useIncident(id)` — fetch single incident with joined data
   - `useCreateIncident(data)` — insert new incident
   - `useUpdateIncident(id, data)` — update incident
   - `useDeleteIncident(id)` — delete incident
   - `useIncidentStats(dateRange)` — aggregate statistics

4. Create `/src/lib/hooks/use-daily-logs.ts`:
   - `useDailyLogs(dateRange?)` — fetch daily logs
   - `useCreateDailyLog(data)` — insert
   - `useUpdateDailyLog(id, data)` — update

5. Create `/src/lib/hooks/use-antecedents.ts` and `/src/lib/hooks/use-consequences.ts`:
   - Fetch default + custom options
   - Create custom options

6. Create `/src/lib/hooks/use-ai-notes.ts`:
   - `useAINotes(filters?)` — fetch AI-formatted notes
   - Note: actual AI formatting calls go through API routes

7. All hooks should:
   - Handle loading, error, and empty states
   - Use optimistic updates where appropriate
   - Return typed data matching the interfaces from Step 2
   - Use the browser Supabase client from Step 1

### Completion Criteria
- All hooks are functional and type-safe
- CRUD operations work against Supabase (test with seed data)
- Error handling is consistent

---

## STEP 5: Incident Logging Form (Core Feature)

### Goal
Build the primary incident logging form — the most important screen in the app. This must be
fast, intuitive, and designed for use during or immediately after a behavioral incident.

### Design Approach
Use a multi-step wizard-style form with large tap targets, pre-populated options, and minimal typing required. Each step should be one screen on mobile.

### Tasks
1. Create `/src/components/forms/incident-form.tsx`:
   - **Step 1: When & Where**
     - Date/time picker (defaults to NOW)
     - Setting selector (large icon buttons: Home, School, Community, Therapy, Other)
     - Optional: Setting detail text input
     - Duration input (optional, minutes:seconds stepper)
   
   - **Step 2: Antecedent (What happened before?)**
     - Grid of pre-defined antecedent buttons (from constants) — multi-select, chip/badge style
     - "Add Custom" button to add new antecedents
     - Free-text notes field: "Describe what was happening before the behavior"
     - Visual prompt: "What was happening right before [child name]'s behavior?"
   
   - **Step 3: Behavior (What happened?)**
     - List of pre-defined target behaviors (from database) — single select, card style
     - Severity selector (4-level with color coding: Low/Medium/High/Crisis)
     - Free-text notes: "Describe exactly what you observed"
     - Visual prompt: "What did [child name] do?"
   
   - **Step 4: Consequence (What happened after?)**
     - Grid of pre-defined consequence buttons — multi-select
     - "Add Custom" button
     - Free-text notes: "Describe what happened after the behavior"
     - Visual prompt: "How did you/others respond? What happened next?"
   
   - **Step 5: Context & Notes**
     - Hypothesized function selector (4 big cards with icons and descriptions: Sensory, Escape, Attention, Tangible, Unknown)
     - People present (tags/chips)
     - Environmental factors (tags/chips)
     - Mood before incident (emoji-style selector)
     - **Parent Notes** — large textarea: "Any additional observations or notes?"
     - **"✨ AI Format" button** — sends parent notes + incident data to AI endpoint, returns formatted clinical note
     - Shows AI-formatted note in a preview card below with "Accept" / "Edit" / "Regenerate" options
   
   - **Step 6: Review & Save**
     - Summary card showing all entered data
     - Edit buttons to go back to any step
     - "Save Incident" primary button
     - "Save & Log Another" secondary button

2. Create `/src/components/forms/quick-log.tsx`:
   - Condensed single-screen version for rapid logging
   - Just: behavior (dropdown), severity, setting, time, and brief notes
   - Can be expanded to full form
   - Accessed via floating action button

3. Form validation with Zod schemas:
   - Create `/src/lib/types/schemas.ts` with Zod schemas matching all form fields
   - Use react-hook-form with @hookform/resolvers/zod

4. UI requirements:
   - Progress indicator at top (step dots or progress bar)
   - Swipe between steps on mobile (or next/back buttons)
   - Large, thumb-friendly buttons (min 48px height)
   - Color-coded severity and function selectors
   - Smooth transitions between steps
   - Auto-save draft to localStorage

### Completion Criteria
- Full form flow works end-to-end
- Data saves correctly to Supabase
- Quick log form works as a condensed alternative
- AI Format button is wired (actual AI logic in Step 8)
- Form is fast and intuitive on mobile

---

## STEP 6: Dashboard (Home Page)

### Goal
Build the main dashboard that gives parents an at-a-glance view of their child's recent
behavioral data, trends, and quick actions.

### Tasks
1. Create `/src/app/page.tsx` (Dashboard):
   - **Top Section: Child greeting & today's summary**
     - "Good [morning/afternoon], [Parent]. Here's [Child]'s day so far."
     - Today's incident count badge
     - Quick-log button

   - **Today's Snapshot Card**
     - Number of incidents today
     - Most common behavior today
     - Most common antecedent today
     - Dominant function today
     - Average severity today (color-coded)

   - **Recent Incidents Timeline**
     - Vertical timeline of last 5 incidents
     - Each shows: time, behavior name (color badge), severity dot, setting icon
     - Tap to expand with antecedent → behavior → consequence flow
     - "View All" link to /incidents

   - **Weekly Trend Mini-Chart**
     - Small bar chart showing incidents per day for the last 7 days
     - Color-coded by severity
     - Tap to go to /reports

   - **Behavior Function Breakdown (This Week)**
     - Donut/pie chart showing distribution of Sensory/Escape/Attention/Tangible
     - Legend with counts

   - **Daily Log Quick Entry**
     - If no daily log for today: prompt card to fill it out
     - If exists: show summary (mood, sleep, medication status)

   - **Quick Actions Grid**
     - Log New Incident
     - Write Daily Note
     - View Reports
     - AI Notes

2. Create chart components in `/src/components/charts/`:
   - `weekly-bar-chart.tsx`
   - `function-donut-chart.tsx`
   - `severity-trend-line.tsx`
   - Use Recharts with custom styling to match app theme

3. Create card components in `/src/components/cards/`:
   - `incident-timeline-card.tsx`
   - `today-snapshot-card.tsx`
   - `daily-log-prompt-card.tsx`
   - `quick-action-card.tsx`

### Completion Criteria
- Dashboard renders with real data from Supabase
- Charts display correctly
- All interactive elements navigate to correct pages
- Empty states handled gracefully (first-time use)
- Mobile layout is clean and scrollable

---

## STEP 7: Incident History & Detail Pages

### Goal
Build the incident list (history) page with powerful filtering and search, plus a detailed
incident view page.

### Tasks
1. Create `/src/app/incidents/page.tsx` (Incident History):
   - **Filter Bar** (sticky at top):
     - Date range picker (Today, This Week, This Month, Custom)
     - Behavior filter (multi-select dropdown)
     - Setting filter (multi-select)
     - Function filter (multi-select)
     - Severity filter (multi-select)
     - Search by notes text
     - "Clear Filters" button
   - **Results Summary**
     - "{X} incidents found" with active filter badges
   - **Incident List**
     - Card-based list, each card shows:
       - Date/time
       - Behavior name (colored badge)
       - Severity indicator (colored dot)
       - Setting icon
       - Function badge
       - First line of notes (truncated)
       - Antecedent count → Consequence count
     - Sorted by most recent first
     - Infinite scroll or pagination
   - **Empty State**
     - Friendly illustration/icon
     - "No incidents recorded yet. Tap + to log your first observation."

2. Create `/src/app/incidents/[id]/page.tsx` (Incident Detail):
   - **Full incident display**:
     - Header with date/time, setting, duration
     - ABC Flow visualization:
       - Antecedent card (what happened before) with listed antecedents and notes
       - → Arrow →
       - Behavior card (what happened) with behavior name, severity badge, notes
       - → Arrow →
       - Consequence card (what happened after) with listed consequences and notes
     - Function badge with explanation
     - Context section: people present, environmental factors, mood
     - **Parent Notes** (raw) in a distinct section
     - **AI-Formatted Notes** in a professional-looking section (if generated)
     - "✨ Generate AI Note" button if not yet generated
   - **Actions**: Edit, Delete (with confirmation), Share/Export

3. Create `/src/components/cards/incident-card.tsx` — reusable incident list card
4. Create `/src/components/cards/abc-flow-display.tsx` — the A→B→C visual flow component

### Completion Criteria
- Filtering works correctly and is performant
- Incident detail page shows all data clearly
- ABC flow visualization is intuitive and visually clear
- Edit/delete operations work

---

## STEP 8: AI Integration (API Routes & UI)

### Goal
Implement the AI-powered features that transform parent notes into provider-ready clinical
documentation. This is the key differentiator of the app.

### AI Features
1. **Format Incident Note**: Takes parent's raw observation and structures it into clinical ABC language
2. **Generate Daily Summary**: Takes all incidents from a day + daily log and creates a provider-ready summary
3. **Suggest Behavior Function**: Analyzes the A-B-C data and suggests the most likely function
4. **Generate Progress Report**: Creates a comprehensive report for a date range

### Tasks
1. Create `/src/app/api/ai/format-note/route.ts`:
   ```typescript
   // POST handler
   // Input: { incident data (antecedents, behavior, consequences, severity, setting, parent_raw_notes) }
   // System prompt instructs GPT-4o to:
   //   - Rewrite the parent's notes in objective, clinical ABA terminology
   //   - Structure as: Setting/Context → Antecedent Description → Behavior Description
   //     (with operational definition) → Consequence Description → Hypothesized Function
   //   - Use person-first or identity-first language (configurable)
   //   - Include duration, severity, and frequency data
   //   - Be concise but thorough
   //   - Output should be suitable for a BCBA reading session notes
   // Output: { formatted_note: string, suggested_function: string }
   ```
   System prompt example:
   ```
   You are a clinical documentation assistant for ABA (Applied Behavior Analysis) therapy.
   You help parents translate their observations into professional behavioral notes suitable
   for BCBAs and therapy teams.

   Given the following incident data from a parent/caregiver, rewrite the observation using:
   - Objective, observable, measurable language
   - Proper ABA terminology (antecedent, behavior, consequence, function)
   - Person-first language (e.g., "the child" or use the child's name)
   - Include all relevant contextual data (setting, time, duration, severity, people present)
   - Structure: Setting & Context → Antecedent → Behavior (with topography) → Consequence → Hypothesized Function
   - Be concise, professional, and factual
   - Do not add information that was not provided
   - Do not make diagnostic statements

   Format the output as a clean, readable clinical note paragraph.
   ```

2. Create `/src/app/api/ai/generate-summary/route.ts`:
   ```typescript
   // POST handler
   // Input: { date, incidents: Incident[], daily_log: DailyLog }
   // System prompt instructs GPT-4o to:
   //   - Summarize all incidents for the day
   //   - Note patterns in antecedents, behaviors, and consequences
   //   - Include daily context (sleep, mood, medication, diet)
   //   - Highlight any concerning patterns
   //   - Make data-informed observations (not recommendations — that's the BCBA's role)
   //   - Suitable for provider review
   // Output: { summary: string }
   ```

3. Create `/src/app/api/ai/suggest-function/route.ts`:
   ```typescript
   // POST handler
   // Input: { antecedents, behavior, consequences, context }
   // Returns: { suggested_function: BehaviorFunction, confidence: 'low'|'medium'|'high', reasoning: string }
   // Note: Clearly labeled as a suggestion, not a clinical determination
   ```

4. Create `/src/app/api/export/route.ts`:
   - Generates CSV or PDF export of incidents for a date range
   - Includes all fields
   - PDF formatted as a professional report

5. Create `/src/app/ai-notes/page.tsx` (AI Notes Hub):
   - View all AI-generated notes
   - Generate new daily summaries
   - Generate progress reports for custom date ranges
   - Copy-to-clipboard functionality
   - "Share with Provider" (generates shareable text)

6. Integrate AI buttons throughout the app:
   - In incident form (Step 5): "✨ AI Format" button
   - In incident detail: "✨ Generate AI Note" button
   - In dashboard: AI daily summary prompt
   - All AI outputs stored in `ai_notes` table

7. Create `/src/components/cards/ai-note-card.tsx`:
   - Displays AI-generated notes in a professional card
   - Shows raw input vs. formatted output
   - Copy, edit, regenerate actions

### Rate Limiting & Error Handling
- Add client-side debouncing on AI buttons (prevent double-clicks)
- Show loading spinner with "AI is writing..." message
- Handle API errors gracefully with user-friendly messages
- Cache AI results in database to avoid redundant calls

### Completion Criteria
- All AI endpoints return well-formatted responses
- Parent notes are transformed into clinical-quality documentation
- AI suggestions are clearly labeled as suggestions
- Notes are stored in database for future reference
- UI for AI features is polished and intuitive

---

## STEP 9: Reports & Data Visualization

### Goal
Build a comprehensive reports page with multiple chart types and data views that help
parents and providers understand behavioral patterns over time.

### Tasks
1. Create `/src/app/reports/page.tsx` with tabbed sections:

   **Tab 1: Overview**
   - Date range selector (Last 7 days, 30 days, 90 days, Custom)
   - KPI cards at top:
     - Total incidents in period
     - Average incidents per day
     - Most common behavior
     - Most common function
     - Most common antecedent
     - Trend direction (↑↓→) compared to previous period
   - Line chart: Incidents over time (by day)
   - Stacked bar chart: Incidents by severity over time
   - Donut chart: Distribution by behavior function
   - Bar chart: Top 10 antecedents
   - Bar chart: Top 10 consequences

   **Tab 2: Behavior Analysis**
   - Select a specific behavior to analyze
   - Frequency over time (line chart)
   - Severity distribution (bar chart)
   - Common antecedents for this behavior (horizontal bar)
   - Common consequences for this behavior (horizontal bar)
   - Function distribution for this behavior (donut)
   - Time-of-day heatmap (when does this behavior occur most?)
   - Setting breakdown (where does it happen most?)

   **Tab 3: ABC Patterns**
   - Sankey diagram or flow visualization: Antecedent → Behavior → Consequence → Function
   - Most common A-B-C chains (table format)
   - Pattern detection: "When [antecedent], [child] often [behavior], resulting in [consequence]"
   - This is extremely valuable for BCBAs doing functional behavior assessments

   **Tab 4: Daily Trends**
   - Calendar heatmap showing incident density by day
   - Correlation views:
     - Sleep hours vs. incident count
     - Mood vs. incident severity
     - Medication adherence vs. behavior frequency
   - Daily logs timeline with incident overlay

   **Tab 5: Export & Share**
   - Generate PDF report for provider
   - Export raw data as CSV
   - Generate AI progress summary for date range
   - Print-friendly view

2. Create chart components:
   - `/src/components/charts/incidents-over-time.tsx`
   - `/src/components/charts/severity-stacked-bar.tsx`
   - `/src/components/charts/function-donut.tsx`
   - `/src/components/charts/antecedent-bar.tsx`
   - `/src/components/charts/consequence-bar.tsx`
   - `/src/components/charts/time-of-day-heatmap.tsx`
   - `/src/components/charts/setting-breakdown.tsx`
   - `/src/components/charts/calendar-heatmap.tsx`
   - `/src/components/charts/correlation-scatter.tsx`
   - `/src/components/charts/abc-pattern-flow.tsx`

3. All charts should:
   - Use consistent color palette from theme
   - Be responsive
   - Have tooltips on hover
   - Handle empty data gracefully
   - Use Recharts with custom styled components

### Completion Criteria
- All 5 report tabs render with real data
- Charts are interactive and responsive
- Date range filtering works across all views
- Export generates proper CSV/PDF
- Performance is good even with 500+ incidents

---

## STEP 10: Settings & Configuration

### Goal
Build the settings page for child profile, behavior definitions, custom antecedents/consequences,
and app preferences.

### Tasks
1. Create `/src/app/settings/page.tsx` with sections:

   **Section 1: Child Profile**
   - Form: First name, last name, date of birth, diagnosis notes
   - Provider info: therapist name/email, BCBA name/email
   - Photo upload (optional — store in Supabase Storage)

   **Section 2: Behavior Library**
   - List of defined target behaviors
   - Add new behavior form:
     - Name
     - Operational definition (with help text explaining what this means)
     - Examples of the behavior
     - Non-examples
     - Is target behavior (to reduce)? / Is replacement behavior (to increase)?
     - Color selector for charts
   - Edit/delete existing behaviors
   - Pre-populated with common ASD behaviors:
     - Aggression (hitting, kicking, biting)
     - Self-injurious behavior
     - Elopement (running away)
     - Tantrum / Meltdown
     - Scripting / Echolalia
     - Stereotypy (stimming)
     - Noncompliance / Task refusal
     - Property destruction
     - Screaming / Vocal protest

   **Section 3: Custom Antecedents & Consequences**
   - View all antecedent options (default + custom)
   - Add custom antecedents
   - View all consequence options (default + custom)
   - Add custom consequences

   **Section 4: AI Preferences**
   - Language preference (person-first vs. identity-first)
   - Note detail level (concise vs. detailed)
   - Include recommendations toggle (on/off — off by default as that's BCBA territory)

   **Section 5: Data Management**
   - Export all data (JSON backup)
   - Import data
   - Clear all data (with double confirmation)

2. Create form components for each section
3. Ensure all settings persist to Supabase

### Completion Criteria
- Child profile saves and displays correctly
- Behavior library is fully manageable (CRUD)
- Custom antecedents/consequences appear in the logging form
- Settings persist across sessions
- Data export/import works

---

## STEP 11: Daily Log Feature

### Goal
Build a daily log feature for tracking contextual factors (sleep, mood, medication, diet)
that correlate with behavioral patterns.

### Tasks
1. Create `/src/components/forms/daily-log-form.tsx`:
   - **Date** (defaults to today)
   - **Overall Mood** (emoji selector: 😊 😐 😟 😠 😴 ⚡)
   - **Sleep Quality** (Poor / Fair / Good / Excellent) with slider or buttons
   - **Sleep Hours** (number stepper, 0-24, half-hour increments)
   - **Medication Given** (Yes/No toggle)
   - **Medication Notes** (conditional text field)
   - **Diet Notes** (text field — notable foods, skipped meals, etc.)
   - **General Notes** (large textarea for any contextual observations)
   - **"✨ AI Summarize Day" button** — sends daily log + all incidents for that day to AI

2. Add daily log prompt to dashboard (Step 6)
3. Add daily log data to correlation charts in Reports (Step 9)
4. Create `/src/components/cards/daily-log-card.tsx` for displaying saved logs

### Completion Criteria
- Daily log form saves to Supabase
- Only one log per day (upsert behavior)
- Correlations visible in reports
- AI summary generation works

---

## STEP 12: Polish, Performance & PWA

### Goal
Final polish pass — optimize performance, add PWA capabilities for offline-first mobile use,
and ensure the app is production-ready.

### Tasks
1. **PWA Setup**:
   - Add `next-pwa` or manual service worker
   - Create `manifest.json` with app name, icons, theme color
   - Cache static assets and recent data
   - Add "Install App" prompt for mobile users

2. **Performance Optimization**:
   - Implement React.lazy/Suspense for chart components (heavy)
   - Use `loading.tsx` files for each route
   - Optimize Supabase queries (add proper indexes — see Deliverable 2)
   - Use `useMemo` / `useCallback` for expensive computations
   - Lazy load images
   - Set proper Cache-Control headers

3. **Empty States & Onboarding**:
   - First-time user flow:
     1. Welcome screen explaining the app
     2. Set up child profile
     3. Add first behavior definitions
     4. Log first incident (guided)
   - Empty states for all lists and charts
   - Helpful tooltips on ABA terminology

4. **Error Handling & Edge Cases**:
   - Global error boundary
   - Network error handling (offline indicators)
   - Form validation error messages
   - Confirmation dialogs for destructive actions
   - Toast notifications for all actions

5. **Accessibility**:
   - Proper ARIA labels
   - Keyboard navigation
   - Color contrast compliance
   - Screen reader support for charts

6. **Final Visual Polish**:
   - Consistent spacing and alignment
   - Smooth page transitions
   - Loading skeletons for data fetches
   - Micro-interactions (button presses, saves, etc.)
   - Responsive testing at all breakpoints

7. **Testing**:
   - Verify all CRUD operations
   - Test AI endpoints with various note styles
   - Test reports with varying data volumes
   - Cross-browser testing (Chrome, Safari, Firefox)
   - Mobile testing (iOS Safari, Android Chrome)

### Completion Criteria
- App is installable as PWA on mobile devices
- Performance score > 90 on Lighthouse
- All empty states are handled
- First-time user experience is smooth
- No console errors in production build
- `pnpm build` completes without errors

---

## STEP 13: Deployment

### Goal
Deploy the application to Vercel and connect to the production Supabase instance.

### Tasks
1. Push code to GitHub repository
2. Connect repo to Vercel
3. Set environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
4. Deploy
5. Test production deployment
6. Set up custom domain (optional)

### Completion Criteria
- App is live and accessible
- All features work in production
- Supabase connection is stable
- AI features work with production API keys

---

## APPENDIX: Key ABA Terminology for AI Context

For AI agents building this app, here is essential ABA terminology context:

- **ABC**: Antecedent-Behavior-Consequence — the three-term contingency framework
- **ABA**: Applied Behavior Analysis — evidence-based therapy for autism
- **BCBA**: Board Certified Behavior Analyst — the supervising therapist
- **RBT**: Registered Behavior Technician — the direct therapy provider
- **FBA**: Functional Behavior Assessment — formal assessment process using ABC data
- **BIP**: Behavior Intervention Plan — the plan developed from FBA data
- **Function of Behavior**: Four main functions — Sensory, Escape, Attention, Tangible (SEAT)
- **Operational Definition**: A precise, observable, measurable definition of a behavior
- **Target Behavior**: A behavior identified for reduction
- **Replacement Behavior**: A more appropriate behavior taught to serve the same function
- **Reinforcement**: Consequence that increases future behavior
- **Extinction**: Withholding reinforcement to decrease behavior
- **Baseline**: Initial data collected before intervention begins
- **Topography**: The physical form/shape of a behavior
```

