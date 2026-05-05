# PeopleFlow HR

An AI-first HR operating system for growing companies. Modern alternative to Workday, BambooHR, Rippling, and Gusto for the small-to-midmarket segment.

This repository is an MVP prototype: a polished marketing site, a fully functional admin product, a complete multi-tenant PostgreSQL schema with row-level security, realistic demo data, and an AI HR assistant with streaming responses.

## What is built end-to-end

- **Marketing site** at `/` — hero, features, AI assistant section, pricing, security, demo request, full footer
- **Auth shell** at `/login`, `/signup`, `/setup`, `/invite` — Supabase-wired in production, demo-bypassed in development
- **Dashboard** at `/dashboard` — KPI tiles, headcount trend, department breakdown, pending approvals, upcoming onboarding, activity feed, compliance alerts
- **Employee directory** at `/people` — searchable, filterable table over 31 employees
- **Employee profile** at `/people/[id]` — Overview, Documents, Time off, Performance, Activity tabs with role-aware compensation visibility
- **Org chart** at `/org-chart` — recursive reporting tree rooted at the CEO
- **Time off** at `/time-off` — request dialog, balance bars, manager approval queue, holiday calendar
- **Time tracking** at `/time-tracking` — weekly grid + approval queue with overtime flags + payroll-ready export
- **Onboarding** at `/onboarding` — pending-start cohort with progress bars and expandable role-aware checklists
- **Offboarding** at `/offboarding` — departing employees with last-day metadata and equipment/access/knowledge tasks
- **Performance** at `/performance` — review cycle pipeline + active goals with progress and category tagging
- **Documents** at `/documents` — visibility-aware library with acknowledgement campaigns
- **Compensation** at `/compensation` — HR-gated salary roll-up with department breakdown (audit-logged on access)
- **Workflows** at `/workflows` — generic approval inbox across time off, comp changes, requisitions, offboardings, and document acknowledgements
- **Recruiting** at `/recruiting` and `/recruiting/[id]` — open requisitions and candidate pipeline by stage
- **Analytics** at `/analytics` — headcount trend, department growth, hiring funnel
- **AI Assistant** at `/assistant` — three-pane chat with streaming responses (Anthropic > OpenAI > deterministic mock fallback)
- **Settings** at `/settings` — company profile, departments, locations, integrations, billing

All 17 spec modules ship as real UIs over real PostgreSQL tables.

---

## Setup

### Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)
- Optional: an Anthropic or OpenAI API key for live AI responses

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database schema

Open the Supabase SQL editor for your project and run, in order:

1. `supabase/migrations/0001_init.sql` — tables, enums, indexes, triggers
2. `supabase/migrations/0002_rls.sql` — row-level security policies and helper functions
3. `supabase/seed/seed.sql` — Northwind Logistics demo tenant with 31 employees, 5 departments, 3 jobs, 10 candidates, 6 PTO requests, and supporting data

Each script is idempotent.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional — provider priority is Anthropic > OpenAI > mock
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Demo mode bypasses real auth and signs in as the demo company admin
NEXT_PUBLIC_DEMO_MODE=true
```

### 4. Run the dev server

```bash
npm run dev
```

The app starts on `http://localhost:3000`.

---

## Demo mode

When `NEXT_PUBLIC_DEMO_MODE=true`, the app bypasses Supabase auth and signs you in as **Marina Vasquez**, the company admin of the **Northwind Logistics** tenant. This lets reviewers click through every gated page without standing up Supabase first.

Demo mode also reads from `lib/demo-data.ts` instead of live Supabase queries. Each consumer is a clean swap-point — replace the demo helper with a Supabase RSC query and RLS will scope results correctly per tenant.

To exit demo mode, set `NEXT_PUBLIC_DEMO_MODE=false` and connect a real Supabase project.

---

## Tech stack

- **Next.js 15** with the App Router and React 19
- **TypeScript**, strict mode
- **Tailwind CSS** with a semantic HSL design token system
- **Radix UI** primitives wrapped into a small component library (button, card, dialog, table, tabs, dropdown, avatar, select)
- **Supabase** for auth, Postgres, RLS, and storage
- **Recharts** for charts
- **Lucide** for icons
- **Anthropic SDK** with OpenAI and mock fallbacks for the AI assistant
- **Geist Sans + Geist Mono** for UI text and numbers
- **Instrument Serif** for marketing display italics

---

## Project structure

```
peopleflow-hr/
├── app/
│   ├── (marketing)/         Public landing
│   ├── (auth)/              Login, signup, invite, workspace setup
│   ├── (app)/               Authenticated product
│   │   ├── dashboard/
│   │   ├── people/          Directory + profile
│   │   ├── org-chart/
│   │   ├── time-off/
│   │   ├── time-tracking/
│   │   ├── onboarding/
│   │   ├── offboarding/
│   │   ├── performance/
│   │   ├── documents/
│   │   ├── compensation/    HR-gated
│   │   ├── workflows/       Approval inbox
│   │   ├── recruiting/
│   │   ├── analytics/
│   │   ├── assistant/       AI chat
│   │   └── settings/
│   └── api/ai/chat/         Streaming AI endpoint
├── components/
│   ├── ui/                  Design system primitives
│   ├── layout/              Sidebar, top bar, page header, module stub
│   ├── dashboard/           KPI tiles
│   ├── charts/              Recharts wrappers
│   ├── people/              Directory client component
│   └── forms/               Time-off dialog, etc.
├── lib/
│   ├── auth/                Session + RBAC helpers (split server/client)
│   ├── supabase/            Browser + server clients
│   ├── demo-data.ts         Typed demo data — swap point for Supabase
│   └── utils.ts
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql    Schema (30+ tables)
│   │   └── 0002_rls.sql     Row-level security
│   └── seed/seed.sql        Demo tenant
├── middleware.ts            Auth gate + session refresh
└── ARCHITECTURE.md
```

---

## Deployment

- **Frontend**: Vercel — connect the repo, add the environment variables above, deploy
- **Database**: Supabase — run the three SQL scripts in order, copy the URL and keys to Vercel
- **AI**: bring your own Anthropic or OpenAI key, or run with the deterministic mock fallback

The app is a stateless Next.js workload. There are no long-running services in this repo; if you add background jobs (digest emails, payroll exports, integration syncs), put them on a separate worker.

---

## Roadmap

Each stub page lists its own roadmap. Cross-cutting items:

- E-signature integration (DocuSign / Dropbox Sign)
- Payroll provider integrations (Gusto, ADP, QuickBooks, Paychex)
- SSO via Okta, Google Workspace, Azure AD
- Slack + email notifications on workflow events
- Mobile employee self-service app
- Custom report builder with saved views and exports
- AI assistant with tool use — let it open requests, draft policies, and pull employee context directly

---

## Security notes

- Supabase RLS is the security boundary. UI `can` helpers in `lib/auth/roles.ts` are convenience only — never trust the client.
- Compensation is restricted to HR + self by default. Managers do not see direct-report compensation unless explicitly granted.
- Documents respect a `visibility` column with four levels: `employee_and_hr`, `hr_only`, `company`, `manager_chain`.
- The service-role Supabase client is used only in trusted server contexts: bootstrap, invite issuance, audit logging, scheduled jobs. It is never exposed to the browser.
- Audit logs are append-only and readable only by HR and admins.
- HARDENING comments in `0001_init.sql` mark every place where additional encryption, secret-vault references, or compliance work is required for a production rollout (SSN/PII columns, integration tokens, BAA-aware document storage, etc.).

This is an MVP, not a finished compliance product. Treat the security checklist as the start of a SOC 2 readiness path, not the end.
