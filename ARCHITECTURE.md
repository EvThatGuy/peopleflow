# Architecture

This document captures the architectural decisions behind the PeopleFlow HR MVP. It is intentionally short. The "why" matters more than the "how" — code is the source of truth for the latter.

## 1. Multi-tenancy via `org_id` + RLS

Every business table has an `org_id` column that references `organizations(id)`. Tenant isolation is enforced by Postgres row-level security, not application code. The pattern:

- A helper `is_member_of(org)` checks whether the current `auth.uid()` has a membership in the target org.
- Every policy on every table includes `is_member_of(org_id)` as a base predicate.
- Reads, writes, and deletes are all gated by RLS.

This makes it impossible for application code to accidentally leak data across tenants — even a buggy query simply returns nothing for unrelated orgs. The trade-off is that every query must run as the authenticated user, never as the service role, in production code paths.

The service-role client (`lib/supabase/server.ts → serviceClient`) exists for three legitimate uses: bootstrap (creating an org during signup), invite issuance (sending an invite to a not-yet-registered user), and audit log writes (which RLS forbids users from inserting directly). It is never used from a client component.

## 2. RBAC via six roles + a `can` helper

Roles are defined in `lib/auth/session.ts`:

- `super_admin` — global, used by Anthropic / PeopleFlow staff for support
- `company_admin` — full control of a tenant
- `hr_manager` — HR operations, including compensation visibility
- `manager` — people manager, can approve time off and see direct-report basics
- `employee` — self-service
- `candidate` — restricted to public-facing recruiting flows

The `can` helper exposes capability predicates (`viewCompensation`, `manageEmployees`, `approveTimeOff`, `viewAuditLogs`, etc.) that the UI uses to conditionally render. The helper is convenience only — RLS still enforces the real boundary. If a developer forgets a `can` check, the user sees a button that does nothing instead of a button that exfiltrates data.

The role check inside RLS is done via `current_role_in(org)` and a manager-chain walk capped at 20 hops to prevent cycles in malformed data.

## 3. The demo-data.ts swap point

`lib/demo-data.ts` is a typed in-memory module that mirrors the seed SQL. Every page reads from helper functions (`getEmployee`, `getDirectReports`, `getActiveEmployees`, `getOpenJobs`, `getPendingApprovals`, `getUpcomingOnboarding`).

Replacing demo mode with live Supabase data is a one-file-at-a-time refactor:

```ts
// before
const employees = getActiveEmployees();

// after
const employees = await supabase
  .from('employees')
  .select('*, department:departments(name), location:locations(name)')
  .eq('status', 'active');
```

RLS handles tenant scoping so the application code does not pass `org_id` explicitly. This is deliberate — every query you write should be safe by default.

## 4. AI provider priority

The AI assistant route at `app/api/ai/chat/route.ts` tries three providers in order:

1. **Anthropic** (`claude-sonnet-4-20250514`) when `ANTHROPIC_API_KEY` is set
2. **OpenAI** (`gpt-4o-mini`) when `OPENAI_API_KEY` is set
3. **Deterministic mock** otherwise

The mock is good enough for demos: it dispatches on intent (PTO, onboarding, JD draft, review draft, headcount) and returns a useful canned response. This means the demo never breaks even without API keys.

In production:

- Persist conversations to `ai_conversations` and `ai_messages`, scoped per user via RLS.
- Add per-user rate limiting (Upstash or Redis).
- If your DPA requires it, redact PII before forwarding to third-party providers, or use zero-data-retention endpoints.
- Swap the system prompt's static org context for live Supabase queries so the assistant always sees current state.

## 5. Payroll-ready, not payroll-processing

PeopleFlow tracks compensation, time off, time entries, and produces payroll exports. It does **not** process payroll. This is a deliberate scope decision:

- Tax filing, direct deposit, and benefits brokerage are regulated, capital-intensive businesses with their own legal exposure.
- Companies in this segment already use Gusto, ADP, QuickBooks, or Paychex. Asking them to switch is a non-starter.
- Owning the system of record while integrating to a payroll provider is the position Rippling and BambooHR took. It is the right one for SMB / midmarket.

The `payroll_exports` and `payroll_export_lines` tables produce CSVs in the formats those four providers accept. Direct API integration is a roadmap item.

## 6. Workflow engine

The `workflows` and `workflow_steps` tables implement a generic sequential approval engine:

- A workflow has a `kind` (e.g., `time_off_request`, `comp_change`, `requisition_approval`) and a polymorphic `subject_type` + `subject_id` reference.
- A workflow has an ordered list of steps. Each step has an assignee, decision (approve / decline / pending), comment, and timestamp.
- The engine progresses to the next step on approval, halts on decline, and emits an audit log entry on every transition.

The time-off module already runs through this engine. New approval-based features (comp changes, requisitions, document acknowledgments) wire into the same engine instead of building bespoke flows.

## 7. Documents with visibility levels

Every document has a `visibility` column with four values:

- `employee_and_hr` — default for personal documents
- `hr_only` — sensitive HR records (offer letters, PIPs)
- `company` — handbooks, policies
- `manager_chain` — visible to the employee's reporting chain

The RLS policy joins through the `employees` table to walk the manager chain when needed. This is bounded to 20 hops to prevent runaway queries.

## 8. Audit logs

`audit_logs` is append-only. RLS forbids updates and deletes from any role. Inserts happen through the service-role client during sensitive operations (comp changes, role changes, document access, integration credential rotations). HR and admins can read; nobody can edit.

This is the foundation of the compliance story. SOC 2 readiness, customer data exports, and incident response all rely on a trustworthy audit log.

## 9. Design system

- **Colors**: warm off-white background, deep navy primary, refined jade accent. Distinct from the predictable enterprise blue while staying trustworthy.
- **Type**: Geist Sans for UI, Geist Mono for all numbers (`tabular-nums` + tight tracking via the `.num` utility), Instrument Serif for marketing display italics.
- **Radius**: 6px default, 4px small, 10px large. Tighter than typical SaaS.
- **Density**: information-dense without being cramped. The directory and dashboard match Linear's information density target rather than Salesforce's.

This is not a Workday clone. It deliberately rejects the busy, branded, mid-2000s enterprise aesthetic in favor of the modern fintech / Linear / Deel direction.

## 10. What we explicitly did not build

- Real auth (signup creates a Supabase user but the demo bypasses it)
- Real payroll processing
- Real integrations — every integration is a placeholder with the credential structure ready
- Mobile native app
- Advanced reporting (custom report builder, scheduled exports)
- Internationalization

These are the right things to leave out of an MVP. They are also the right things to build second.
