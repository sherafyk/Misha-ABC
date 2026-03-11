# ABC Tracker (Step 1 Scaffold)

This project is a Next.js 16 App Router scaffold for the ABC behavior tracking app.

## Getting Started

Install dependencies and run the app:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Binary file migration note

Binary artifacts are intentionally excluded from this repository. If you are migrating from a branch or local copy that used a binary favicon (`src/app/favicon.ico`), use this text-based replacement flow:

1. Remove the binary icon file if it exists:
   ```bash
   rm -f src/app/favicon.ico
   ```
2. Add a text-based SVG app icon (already committed in this branch at `src/app/icon.svg`).
3. If you need your old `.ico` in production, store it outside git (artifact storage or deployment asset pipeline) and reference it at deploy time.

## Included in Step 1

- Next.js + TypeScript + Tailwind + ESLint scaffold.
- shadcn/ui initialization and requested component primitives.
- Supabase browser/server helpers under `src/lib/supabase`.
- Step 1 route and folder placeholders for app pages and API routes.


## Security mode (read-only by default)

This app now runs in **read-only mode** for all visitors. Data mutations require an admin password login and are executed through server routes.

### Required Supabase keys

Use these exact keys:

- `NEXT_PUBLIC_SUPABASE_URL` → Supabase Project URL (safe to expose).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **anon / public / publishable** key (safe for browser read access).
- `SUPABASE_SERVICE_ROLE_KEY` → **service_role / secret** key (server only, never expose to browser).

### Required admin env vars

- `ADMIN_ACCESS_PASSWORD` → strong password used for admin login.
- `ADMIN_SESSION_SECRET` → long random secret used to sign admin session cookies.

### Apply database policies

Run `supabase-security.sql` in the Supabase SQL editor to allow read-only access and block direct writes from anon/authenticated clients.
