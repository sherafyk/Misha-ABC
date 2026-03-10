# 🧩 ABC Behavior Tracker

**A sleek, AI-powered web application for parents and caregivers to track and document behavioral incidents using the ABC (Antecedent-Behavior-Consequence) framework from Applied Behavior Analysis (ABA) therapy.**

Built for a single child. Built for speed. Built for the data your providers actually need.

---

## 📖 Overview

ABC Behavior Tracker helps parents of children receiving ABA therapy services log behavioral incidents in a structured, clinically meaningful way — without needing to learn clinical terminology. The app captures what happened **before** a behavior (Antecedent), the **behavior** itself, and what happened **after** (Consequence), then uses AI to transform raw parent observations into provider-ready clinical documentation suitable for BCBAs, RBTs, and therapy teams [[11]].

The ABC data collection model is the gold standard assessment tool in Applied Behavior Analysis. As described by Dr. Cathy Pratt, BCBA-D, "ABC refers to: Antecedent — the events, action, or circumstances that occur before a behavior; Behavior — The behavior; Consequences — The action or response that follows the behavior" [[11]]. This app digitizes and enhances that process.

### Why This App Exists

Parents are critical members of the behavioral assessment team, but traditional paper-based ABC data sheets are cumbersome, inconsistent, and lack analytical power [[11]]. Common barriers include time constraints, difficulty remembering to document during crisis situations, and maintaining consistency [[11]]. This app overcomes those barriers by providing:

- ⚡ **Quick logging** — tap-friendly forms that default to common options
- 🤖 **AI formatting** — write in your own words, get clinical-quality notes
- 📊 **Rich analytics** — automatic pattern detection across antecedents, behaviors, consequences, and functions
- 📋 **Provider-ready exports** — PDF and CSV reports formatted for BCBA review

---

## ✨ Key Features

### 🔵 Incident Logging
- **Multi-step wizard form** with large, thumb-friendly tap targets optimized for mobile use during or immediately after incidents
- **Quick Log mode** — condensed single-screen entry for rapid capture
- Pre-populated antecedents (20 defaults) and consequences (18 defaults) based on ABA best practices [[11]]
- Multi-select antecedents and consequences with custom option creation
- Severity tracking (Low → Medium → High → Crisis) with color coding
- Setting tracking (Home, School, Community, Therapy, Other)
- Duration, people present, environmental factors, and mood tracking
- Auto-save drafts to prevent data loss

### 🤖 AI-Powered Documentation
- **Note Formatting** — paste raw parent observations and get structured clinical notes using proper ABA terminology, objective language, and person-first phrasing
- **Daily Summaries** — AI-generated end-of-day reports combining all incidents with contextual data (sleep, mood, medication, diet)
- **Function Suggestions** — AI analyzes the A-B-C chain and suggests the most likely behavior function (Sensory, Escape, Attention, Tangible) [[11]]
- **Progress Reports** — generate comprehensive reports for any date range
- All AI outputs clearly labeled as suggestions, not clinical determinations

### 📊 Reports & Analytics
- **Overview Dashboard** — KPIs, incident trends, severity distribution, function breakdown
- **Behavior Analysis** — drill into any specific behavior for frequency, severity, common antecedents/consequences, time-of-day heatmap, and setting breakdown
- **ABC Pattern Detection** — identifies recurring Antecedent → Behavior → Consequence chains (invaluable for BCBAs conducting Functional Behavior Assessments) [[11]]
- **Daily Trends** — calendar heatmap, sleep/mood/medication correlations
- **Export** — PDF reports and CSV data exports for provider sharing

### 📝 Daily Logs
- Track contextual factors: sleep quality/hours, mood, medication, diet, general notes
- Correlate daily context with behavioral patterns
- AI-summarized daily overviews

### ⚙️ Behavior Library
- Pre-loaded with 10 common ASD behaviors (8 target, 2 replacement) including operational definitions, examples, and non-examples
- Fully customizable — add, edit, or remove behaviors
- Color-coded for visual clarity in charts and reports

### 🏠 Single-Family Design
- **No login or authentication required** — this is your private tool
- Single-child focus for simplicity
- Mobile-first, installable as a PWA for home screen access

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14+ (App Router, Server Components) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS 3.4+ with shadcn/ui components |
| **Database** | Supabase (PostgreSQL) |
| **AI** | OpenAI GPT-4o via server-side API routes |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod validation |
| **Deployment** | Vercel |
| **Package Manager** | pnpm |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed
- **pnpm** installed (`npm install -g pnpm`)
- A **Supabase** account (free tier works) — [supabase.com](https://supabase.com)
- An **OpenAI API key** — [platform.openai.com](https://platform.openai.com)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/abc-tracker.git
cd abc-tracker
