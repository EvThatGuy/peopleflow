-- =============================================================================
-- PeopleFlow HR — Initial schema
-- =============================================================================
-- Multi-tenant HR platform. Every domain table includes organization_id for
-- tenant isolation enforced via Supabase Row-Level Security.
--
-- Conventions:
--   * UUID primary keys, generated server-side.
--   * created_at / updated_at on every table; updated_at maintained by trigger.
--   * Enums for finite states; lookup tables for tenant-customizable values.
--   * Soft deletes via `archived_at` where audit history matters; hard deletes
--     elsewhere. Audit logs capture sensitive changes regardless.
--
-- Compliance notes embedded throughout. Anything tagged HARDENING flags work
-- that must be done before handling real PII at scale (encryption-at-rest for
-- SSN-equivalent fields, BAA-aware storage for any health-adjacent docs, etc.).
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type app_role as enum (
  'super_admin',     -- PeopleFlow staff; cross-tenant access
  'company_admin',   -- Tenant owner; full access within their org
  'hr_manager',      -- Full HR access; can see comp, run reports, manage approvals
  'manager',         -- People-manager; sees direct reports + their teams
  'employee',        -- Self-service only
  'candidate'        -- External; ATS portal access only
);

create type employment_status as enum (
  'active', 'on_leave', 'terminated', 'pending_start', 'offboarding'
);

create type employment_type as enum (
  'full_time', 'part_time', 'contractor', 'intern', 'temporary'
);

create type pay_frequency as enum (
  'weekly', 'biweekly', 'semimonthly', 'monthly', 'annual'
);

create type pay_basis as enum ('salary', 'hourly');

create type time_off_status as enum (
  'pending', 'approved', 'rejected', 'cancelled'
);

create type time_off_kind as enum (
  'vacation', 'sick', 'personal', 'bereavement', 'parental', 'jury_duty', 'unpaid', 'other'
);

create type onboarding_task_status as enum (
  'not_started', 'in_progress', 'completed', 'skipped', 'overdue'
);

create type workflow_status as enum (
  'draft', 'in_review', 'approved', 'rejected', 'cancelled'
);

create type approval_decision as enum ('pending', 'approved', 'rejected', 'delegated');

create type job_status as enum ('draft', 'open', 'on_hold', 'closed', 'filled');

create type candidate_stage as enum (
  'applied', 'screening', 'phone_screen', 'interview', 'final_round',
  'offer_extended', 'offer_accepted', 'offer_declined', 'hired', 'rejected', 'withdrawn'
);

create type review_status as enum ('not_started', 'in_progress', 'submitted', 'finalized');

create type goal_status as enum ('not_started', 'on_track', 'at_risk', 'off_track', 'completed', 'cancelled');

-- -----------------------------------------------------------------------------
-- Core tenant tables
-- -----------------------------------------------------------------------------
create table organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            citext unique not null,
  domain          citext,                            -- e.g. example.com (for invite allowlist)
  logo_url        text,
  industry        text,
  size_band       text,                              -- "1-10","11-50","51-200","201-1000","1000+"
  country         text default 'US',
  timezone        text default 'America/Chicago',
  plan            text default 'starter',            -- 'starter','growth','scale','enterprise'
  trial_ends_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Maps Supabase auth.users -> our domain user.
-- We don't duplicate auth fields; we link to auth.uid().
create table users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           citext not null unique,
  full_name       text,
  avatar_url      text,
  phone           text,
  -- Last selected organization. Helps the UI pick a default tenant after login.
  active_org_id   uuid references organizations(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- A user can belong to multiple organizations (consultants, agency staff, super admins).
-- One membership per (user, org). Role lives here; permissions derive from role.
create table memberships (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role            app_role not null,
  invited_by      uuid references users(id),
  invited_at      timestamptz,
  accepted_at     timestamptz,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, organization_id)
);

create index idx_memberships_org on memberships(organization_id) where archived_at is null;
create index idx_memberships_user on memberships(user_id) where archived_at is null;

-- -----------------------------------------------------------------------------
-- Org structure: departments, locations, job titles
-- -----------------------------------------------------------------------------
create table departments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  parent_id       uuid references departments(id) on delete set null,
  head_employee_id uuid,                             -- FK added below (forward ref)
  description     text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, name)
);
create index idx_departments_org on departments(organization_id);

create table locations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,                    -- "HQ — Kansas City"
  address_line1   text,
  address_line2   text,
  city            text,
  state           text,
  postal_code     text,
  country         text default 'US',
  timezone        text,
  is_remote       boolean not null default false,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, name)
);
create index idx_locations_org on locations(organization_id);

create table job_titles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  job_family      text,                              -- "Engineering","Sales","People Ops"
  level           text,                              -- "L3","Senior","Principal"
  description     text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, name)
);
create index idx_job_titles_org on job_titles(organization_id);

-- -----------------------------------------------------------------------------
-- Employees — the heart of the system
-- -----------------------------------------------------------------------------
-- An employee record exists per (organization, person). user_id is nullable
-- so HR can create employee records before the person logs in (or for
-- contractors who never get an account).
create table employees (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  user_id             uuid references users(id) on delete set null,
  employee_number     text,                          -- tenant-defined identifier (E-1024)
  preferred_first_name text,
  legal_first_name    text not null,
  legal_last_name     text not null,
  middle_name         text,
  email_work          citext,
  email_personal      citext,
  phone_mobile        text,
  phone_work          text,
  -- Demographic fields are EEOC-relevant; restrict access to HR roles only via RLS.
  date_of_birth       date,
  gender_identity     text,
  pronouns            text,
  -- HARDENING: SSN/SIN/national-ID equivalent should NOT live in this column long-term.
  -- Encrypt via pgsodium or store in a separate vaulted table with break-glass access.
  national_id_last4   text,                           -- placeholder for masked tax ID
  -- Address
  home_address_line1  text,
  home_address_line2  text,
  home_city           text,
  home_state          text,
  home_postal_code    text,
  home_country        text default 'US',
  -- Emergency contact
  emergency_contact_name     text,
  emergency_contact_relation text,
  emergency_contact_phone    text,
  -- Photo
  avatar_url          text,
  -- Status
  status              employment_status not null default 'pending_start',
  hired_at            date,
  start_date          date,
  termination_date    date,
  termination_reason  text,
  is_eligible_for_rehire boolean,
  -- Org placement (denormalized current state; history is in employment_records)
  manager_id          uuid references employees(id) on delete set null,
  department_id       uuid references departments(id) on delete set null,
  location_id         uuid references locations(id) on delete set null,
  job_title_id        uuid references job_titles(id) on delete set null,
  employment_type     employment_type,
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (organization_id, employee_number)
);
create index idx_employees_org on employees(organization_id);
create index idx_employees_manager on employees(manager_id);
create index idx_employees_dept on employees(department_id);
create index idx_employees_user on employees(user_id);
create index idx_employees_status on employees(organization_id, status);

-- now that employees exists, attach the head_employee_id FK
alter table departments
  add constraint fk_dept_head foreign key (head_employee_id) references employees(id) on delete set null;

-- Employment history: every change to title/dept/location/employment_type writes a row.
-- effective_to is null for the current record.
create table employment_records (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  employee_id       uuid not null references employees(id) on delete cascade,
  job_title_id      uuid references job_titles(id) on delete set null,
  department_id     uuid references departments(id) on delete set null,
  location_id       uuid references locations(id) on delete set null,
  manager_id        uuid references employees(id) on delete set null,
  employment_type   employment_type,
  change_reason     text,                            -- 'hire','promotion','transfer','reorg','title_change'
  effective_from    date not null,
  effective_to      date,
  created_by        uuid references users(id),
  created_at        timestamptz not null default now()
);
create index idx_employment_records_emp on employment_records(employee_id, effective_from desc);

-- Compensation history. Only HR roles can read; enforced via RLS.
create table compensation_records (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  employee_id         uuid not null references employees(id) on delete cascade,
  pay_basis           pay_basis not null,
  base_amount         numeric(14,2) not null,        -- annual if salary, per-hour if hourly
  currency            text not null default 'USD',
  pay_frequency       pay_frequency not null,
  bonus_target_pct    numeric(5,2),                  -- e.g. 10.00 = 10% target
  equity_grant        text,                          -- free-form: "1,500 RSUs vesting 4yr"
  effective_from      date not null,
  effective_to        date,
  change_reason       text,                          -- 'hire','merit','promotion','market_adjustment'
  approved_by         uuid references users(id),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_comp_emp on compensation_records(employee_id, effective_from desc);

-- -----------------------------------------------------------------------------
-- Documents & policies
-- -----------------------------------------------------------------------------
-- Files live in Supabase Storage; this row is the metadata + ACL anchor.
-- HARDENING: bucket policies must mirror the per-row visibility logic below.
create table documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  employee_id     uuid references employees(id) on delete cascade,  -- null = company-wide
  uploaded_by     uuid references users(id),
  storage_path    text not null,                     -- bucket path
  file_name       text not null,
  mime_type       text,
  size_bytes      bigint,
  category        text,                              -- 'offer_letter','i9','contract','review','tax','other'
  -- Access control: who can read this doc? Default: HR + employee themselves + their manager.
  visibility      text not null default 'employee_and_hr',  -- 'employee_and_hr','hr_only','company','manager_chain'
  signed_at       timestamptz,                       -- HARDENING: integrate w/ DocuSign/HelloSign for legal signing
  signature_status text default 'unsigned',          -- 'unsigned','sent','signed','declined'
  expires_at      timestamptz,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_documents_org on documents(organization_id);
create index idx_documents_employee on documents(employee_id);

create table policies (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title           text not null,
  slug            text not null,
  body_md         text,                              -- markdown content
  version         int not null default 1,
  effective_from  date,
  acknowledgment_required boolean not null default false,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, slug, version)
);
create index idx_policies_org on policies(organization_id);

create table policy_acknowledgments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  policy_id       uuid not null references policies(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  ip_address      inet,
  unique (policy_id, employee_id)
);

-- -----------------------------------------------------------------------------
-- Onboarding & offboarding
-- -----------------------------------------------------------------------------
create table onboarding_templates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  description     text,
  applies_to_department_id uuid references departments(id) on delete set null,
  is_default      boolean not null default false,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Template tasks; copied into onboarding_tasks when a new hire starts.
create table onboarding_template_tasks (
  id              uuid primary key default gen_random_uuid(),
  template_id     uuid not null references onboarding_templates(id) on delete cascade,
  title           text not null,
  description     text,
  category        text,                              -- 'paperwork','equipment','accounts','training','intro'
  assignee_role   text,                              -- 'new_hire','manager','it','hr','buddy'
  due_offset_days int not null default 0,            -- relative to start_date
  ordinal         int not null default 0
);

create table onboarding_tasks (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  employee_id       uuid not null references employees(id) on delete cascade,
  template_task_id  uuid references onboarding_template_tasks(id) on delete set null,
  title             text not null,
  description       text,
  category          text,
  assignee_user_id  uuid references users(id) on delete set null,
  assignee_employee_id uuid references employees(id) on delete set null,
  due_date          date,
  status            onboarding_task_status not null default 'not_started',
  completed_at      timestamptz,
  completed_by      uuid references users(id),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_onb_tasks_emp on onboarding_tasks(employee_id, status);

create table offboarding_tasks (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  employee_id       uuid not null references employees(id) on delete cascade,
  title             text not null,
  description       text,
  category          text,                              -- 'access_removal','equipment_return','exit_interview','final_pay','documents'
  assignee_user_id  uuid references users(id) on delete set null,
  due_date          date,
  status            onboarding_task_status not null default 'not_started',
  completed_at      timestamptz,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_off_tasks_emp on offboarding_tasks(employee_id, status);

-- -----------------------------------------------------------------------------
-- Time off & PTO
-- -----------------------------------------------------------------------------
create table pto_policies (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  name                text not null,
  kind                time_off_kind not null,
  accrual_method      text not null default 'annual_grant',  -- 'annual_grant','monthly_accrual','unlimited','per_pay_period'
  annual_hours        numeric(8,2),                  -- for grants
  accrual_per_period  numeric(8,2),                  -- for accrual
  carryover_max_hours numeric(8,2),
  waiting_period_days int not null default 0,
  is_paid             boolean not null default true,
  applies_to_employment_type employment_type,        -- null = all types
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table pto_balances (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  policy_id       uuid not null references pto_policies(id) on delete cascade,
  balance_hours   numeric(8,2) not null default 0,
  used_hours      numeric(8,2) not null default 0,
  pending_hours   numeric(8,2) not null default 0,
  as_of_date      date not null default current_date,
  updated_at      timestamptz not null default now(),
  unique (employee_id, policy_id)
);
create index idx_pto_balances_emp on pto_balances(employee_id);

create table time_off_requests (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  policy_id       uuid references pto_policies(id) on delete set null,
  kind            time_off_kind not null,
  starts_on       date not null,
  ends_on         date not null,
  hours_requested numeric(8,2) not null,
  reason          text,
  status          time_off_status not null default 'pending',
  reviewed_by     uuid references users(id),
  reviewed_at     timestamptz,
  review_notes    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_pto_req_org on time_off_requests(organization_id, status);
create index idx_pto_req_emp on time_off_requests(employee_id, starts_on desc);

create table company_holidays (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  observed_on     date not null,
  applies_to_location_id uuid references locations(id) on delete set null,
  is_paid         boolean not null default true,
  created_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Time tracking
-- -----------------------------------------------------------------------------
create table time_entries (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  work_date       date not null,
  clock_in        timestamptz,
  clock_out       timestamptz,
  break_minutes   int not null default 0,
  hours_worked    numeric(6,2),                      -- computed; nullable while in progress
  is_overtime     boolean not null default false,    -- HARDENING: true overtime is jurisdiction-dependent
  project_code    text,
  notes           text,
  approved_by     uuid references users(id),
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_time_entries_emp on time_entries(employee_id, work_date desc);
create index idx_time_entries_org on time_entries(organization_id, work_date desc);

-- -----------------------------------------------------------------------------
-- Payroll exports (PeopleFlow does NOT process payroll itself in MVP)
-- -----------------------------------------------------------------------------
-- A payroll_export captures the data we hand off to Gusto/ADP/QuickBooks/Paychex.
create table payroll_exports (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  pay_period_start date not null,
  pay_period_end   date not null,
  pay_date         date not null,
  destination     text not null,                     -- 'gusto','adp','quickbooks','paychex','csv'
  status          text not null default 'draft',     -- 'draft','exported','processed','failed'
  export_format   text not null default 'csv',
  file_storage_path text,
  generated_by    uuid references users(id),
  generated_at    timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table payroll_export_lines (
  id              uuid primary key default gen_random_uuid(),
  export_id       uuid not null references payroll_exports(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  regular_hours   numeric(8,2) not null default 0,
  overtime_hours  numeric(8,2) not null default 0,
  pto_hours       numeric(8,2) not null default 0,
  holiday_hours   numeric(8,2) not null default 0,
  gross_amount    numeric(14,2),
  bonus_amount    numeric(14,2) not null default 0,
  -- Deductions stored as JSON for now; structured table later when MVP integrations land.
  deductions      jsonb not null default '[]'::jsonb
);

-- -----------------------------------------------------------------------------
-- Recruiting / ATS
-- -----------------------------------------------------------------------------
create table jobs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title           text not null,
  department_id   uuid references departments(id) on delete set null,
  location_id     uuid references locations(id) on delete set null,
  job_title_id    uuid references job_titles(id) on delete set null,
  employment_type employment_type,
  description_md  text,
  responsibilities_md text,
  requirements_md text,
  salary_min      numeric(14,2),
  salary_max      numeric(14,2),
  salary_currency text default 'USD',
  status          job_status not null default 'draft',
  hiring_manager_id uuid references employees(id) on delete set null,
  recruiter_id    uuid references employees(id) on delete set null,
  posted_at       timestamptz,
  closed_at       timestamptz,
  created_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_jobs_org on jobs(organization_id, status);

create table candidates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  job_id          uuid references jobs(id) on delete set null,
  user_id         uuid references users(id) on delete set null,  -- if they have a candidate portal account
  first_name      text not null,
  last_name       text not null,
  email           citext not null,
  phone           text,
  resume_storage_path text,
  cover_letter_md text,
  source          text,                              -- 'linkedin','referral','careers_site','indeed'
  referrer_employee_id uuid references employees(id) on delete set null,
  stage           candidate_stage not null default 'applied',
  rating          int check (rating between 1 and 5),
  applied_at      timestamptz not null default now(),
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_candidates_job on candidates(job_id, stage);
create index idx_candidates_org on candidates(organization_id, stage);

create table candidate_notes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id    uuid not null references candidates(id) on delete cascade,
  author_user_id  uuid references users(id) on delete set null,
  body            text not null,
  is_private      boolean not null default false,
  created_at      timestamptz not null default now()
);

create table interviews (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id    uuid not null references candidates(id) on delete cascade,
  job_id          uuid references jobs(id) on delete set null,
  scheduled_for   timestamptz,
  duration_minutes int default 45,
  format          text,                              -- 'phone','video','onsite','panel'
  interviewer_employee_ids uuid[] default array[]::uuid[],
  feedback_md     text,
  rating          int check (rating between 1 and 5),
  outcome         text,                              -- 'advance','hold','reject'
  status          text not null default 'scheduled', -- 'scheduled','completed','no_show','cancelled'
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_interviews_candidate on interviews(candidate_id, scheduled_for);

-- -----------------------------------------------------------------------------
-- Performance management
-- -----------------------------------------------------------------------------
create table review_cycles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,                     -- "Q4 2025 Performance Review"
  starts_on       date not null,
  ends_on         date not null,
  self_review_required boolean not null default true,
  peer_review_required boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table performance_reviews (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  cycle_id        uuid references review_cycles(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  reviewer_id     uuid references employees(id) on delete set null,  -- usually the manager
  status          review_status not null default 'not_started',
  self_review_md  text,
  manager_review_md text,
  overall_rating  text,                              -- 'exceeds','meets','developing','below'
  strengths_md    text,
  growth_areas_md text,
  promotion_ready boolean,
  submitted_at    timestamptz,
  finalized_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_reviews_emp on performance_reviews(employee_id, created_at desc);

create table goals (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  title           text not null,
  description_md  text,
  measurement     text,                              -- KPI / definition of done
  category        text,                              -- 'okr','development','project'
  parent_goal_id  uuid references goals(id) on delete set null,
  status          goal_status not null default 'not_started',
  progress_pct    int not null default 0 check (progress_pct between 0 and 100),
  starts_on       date,
  due_on          date,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_goals_emp on goals(employee_id, status);

create table one_on_ones (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  manager_id      uuid not null references employees(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  scheduled_for   timestamptz not null,
  agenda_md       text,
  notes_md        text,
  action_items    jsonb default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Workflows & approvals
-- -----------------------------------------------------------------------------
-- Generic workflow engine. Any approvable action (time off, comp change, job
-- requisition, offboarding) creates a workflow row + sequential workflow_steps.
-- subject_type/subject_id forms a polymorphic reference back to the originating record.
create table workflows (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  kind            text not null,                     -- 'time_off','comp_change','job_req','onboarding','offboarding','doc_ack'
  subject_type    text not null,                     -- 'time_off_request','compensation_record','job',...
  subject_id      uuid not null,
  initiated_by    uuid references users(id),
  status          workflow_status not null default 'in_review',
  current_step    int not null default 1,
  due_at          timestamptz,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_workflows_org on workflows(organization_id, status);
create index idx_workflows_subject on workflows(subject_type, subject_id);

create table workflow_steps (
  id              uuid primary key default gen_random_uuid(),
  workflow_id     uuid not null references workflows(id) on delete cascade,
  step_number     int not null,
  approver_user_id uuid references users(id) on delete set null,
  approver_role   app_role,                          -- alternative: any user with this role
  decision        approval_decision not null default 'pending',
  decided_at      timestamptz,
  comments        text,
  unique (workflow_id, step_number)
);
create index idx_workflow_steps_wf on workflow_steps(workflow_id);

-- -----------------------------------------------------------------------------
-- Audit log — append-only record of sensitive changes
-- -----------------------------------------------------------------------------
create table audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id   uuid references users(id) on delete set null,
  action          text not null,                     -- 'create','update','delete','view_compensation','export_payroll'
  entity_type     text not null,
  entity_id       uuid,
  diff            jsonb,                             -- {before:{...}, after:{...}}
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);
create index idx_audit_org on audit_logs(organization_id, created_at desc);
create index idx_audit_entity on audit_logs(entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- AI assistant
-- -----------------------------------------------------------------------------
create table ai_conversations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  title           text,
  context_kind    text,                              -- 'general','employee_profile','review','onboarding','policy'
  context_ref_id  uuid,                              -- e.g. employee_id when context_kind='employee_profile'
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_ai_conv_user on ai_conversations(user_id, created_at desc);

create table ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role            text not null,                     -- 'user','assistant','system','tool'
  content         text not null,
  -- HARDENING: log token counts + model used for billing/cost attribution.
  model           text,
  token_count     int,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index idx_ai_msg_conv on ai_messages(conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- Integrations (placeholders; secrets live encrypted via Supabase Vault)
-- -----------------------------------------------------------------------------
create table integrations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider        text not null,                     -- 'gusto','adp','quickbooks','paychex','slack','google_workspace','okta'
  display_name    text,
  status          text not null default 'disconnected', -- 'disconnected','connected','error'
  config          jsonb default '{}'::jsonb,         -- non-secret config (workspace IDs, sync mode)
  -- HARDENING: do NOT store tokens here. Reference Supabase Vault secret IDs only.
  vault_secret_ref text,
  last_synced_at  timestamptz,
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, provider)
);

-- -----------------------------------------------------------------------------
-- updated_at maintenance trigger (applied to every table that needs it)
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
  tables text[] := array[
    'organizations','users','memberships','departments','locations','job_titles',
    'employees','compensation_records','documents','policies','onboarding_templates',
    'onboarding_tasks','offboarding_tasks','pto_policies','time_off_requests','time_entries',
    'payroll_exports','jobs','candidates','interviews','review_cycles','performance_reviews',
    'goals','one_on_ones','workflows','ai_conversations','integrations'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_%1$s_updated on %1$s', t);
    execute format('create trigger trg_%1$s_updated before update on %1$s for each row execute function set_updated_at()', t);
  end loop;
end$$;
