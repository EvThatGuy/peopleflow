-- =============================================================================
-- PeopleFlow HR — Row-Level Security policies
-- =============================================================================
-- Two principles:
--   1. EVERY domain table requires organization_id and is filtered by it.
--   2. Within a tenant, role gates what each user can read/write.
--
-- Helpers (security-definer functions) are defined first; policies reference them.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions
-- -----------------------------------------------------------------------------

-- Returns the current user's role within a given organization, or null.
create or replace function current_role_in(org uuid)
returns app_role
language sql stable security definer
set search_path = public
as $$
  select role
  from public.memberships
  where user_id = auth.uid()
    and organization_id = org
    and archived_at is null
  limit 1
$$;

-- Boolean helpers, kept short so policies read clearly.
create or replace function is_member_of(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and organization_id = org and archived_at is null
  )
$$;

create or replace function is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and role = 'super_admin' and archived_at is null
  )
$$;

create or replace function is_hr_or_admin(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select current_role_in(org) in ('company_admin','hr_manager','super_admin')
$$;

create or replace function is_manager_or_above(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select current_role_in(org) in ('company_admin','hr_manager','manager','super_admin')
$$;

-- The employee record for the current user in a given org (null if none).
create or replace function current_employee_id(org uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.employees
   where organization_id = org and user_id = auth.uid()
   limit 1
$$;

-- True if `target_employee` is the current user OR reports up through them.
-- Used for manager-chain visibility (managers see their team and their team's teams).
create or replace function can_see_employee(target_employee uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  org uuid;
  me uuid;
  cursor_id uuid;
  steps int := 0;
begin
  select organization_id into org from public.employees where id = target_employee;
  if org is null then return false; end if;
  if is_hr_or_admin(org) then return true; end if;

  me := current_employee_id(org);
  if me is null then return false; end if;
  if me = target_employee then return true; end if;

  -- Walk up the manager chain from target; if we hit `me`, target is in my reporting tree.
  cursor_id := target_employee;
  while steps < 20 loop                              -- safety cap; orgs deeper than 20 are unrealistic
    select manager_id into cursor_id from public.employees where id = cursor_id;
    if cursor_id is null then return false; end if;
    if cursor_id = me then return true; end if;
    steps := steps + 1;
  end loop;
  return false;
end$$;

-- -----------------------------------------------------------------------------
-- Enable RLS on every domain table
-- -----------------------------------------------------------------------------
alter table organizations            enable row level security;
alter table users                    enable row level security;
alter table memberships              enable row level security;
alter table departments              enable row level security;
alter table locations                enable row level security;
alter table job_titles               enable row level security;
alter table employees                enable row level security;
alter table employment_records       enable row level security;
alter table compensation_records     enable row level security;
alter table documents                enable row level security;
alter table policies                 enable row level security;
alter table policy_acknowledgments   enable row level security;
alter table onboarding_templates     enable row level security;
alter table onboarding_template_tasks enable row level security;
alter table onboarding_tasks         enable row level security;
alter table offboarding_tasks        enable row level security;
alter table pto_policies             enable row level security;
alter table pto_balances             enable row level security;
alter table time_off_requests        enable row level security;
alter table company_holidays         enable row level security;
alter table time_entries             enable row level security;
alter table payroll_exports          enable row level security;
alter table payroll_export_lines     enable row level security;
alter table jobs                     enable row level security;
alter table candidates               enable row level security;
alter table candidate_notes          enable row level security;
alter table interviews               enable row level security;
alter table review_cycles            enable row level security;
alter table performance_reviews      enable row level security;
alter table goals                    enable row level security;
alter table one_on_ones              enable row level security;
alter table workflows                enable row level security;
alter table workflow_steps           enable row level security;
alter table audit_logs               enable row level security;
alter table ai_conversations         enable row level security;
alter table ai_messages              enable row level security;
alter table integrations             enable row level security;

-- -----------------------------------------------------------------------------
-- Organizations & users & memberships
-- -----------------------------------------------------------------------------
create policy "org: members can read their orgs"
  on organizations for select
  using (is_member_of(id));

create policy "org: super admins read all"
  on organizations for select
  using (is_super_admin());

create policy "org: company admins update their org"
  on organizations for update
  using (current_role_in(id) in ('company_admin','super_admin'))
  with check (current_role_in(id) in ('company_admin','super_admin'));

create policy "users: read self"
  on users for select using (id = auth.uid());
create policy "users: update self"
  on users for update using (id = auth.uid()) with check (id = auth.uid());

create policy "memberships: read own"
  on memberships for select using (user_id = auth.uid() or is_hr_or_admin(organization_id));
create policy "memberships: admin manage"
  on memberships for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));

-- -----------------------------------------------------------------------------
-- Tenant-scoped read policies
--
-- Most tables follow the same pattern: any member of the org can read,
-- but only HR/admin can write. We codify this as DO blocks for brevity.
-- -----------------------------------------------------------------------------

-- Tables where ALL members read; HR/admin write.
do $$
declare t text;
declare tables text[] := array[
  'departments','locations','job_titles','policies','onboarding_templates',
  'onboarding_template_tasks','pto_policies','company_holidays','review_cycles'
];
begin
  foreach t in array tables loop
    execute format($f$
      create policy "%1$s: members read"
        on %1$s for select using (is_member_of(organization_id));
      create policy "%1$s: hr write"
        on %1$s for all
        using (is_hr_or_admin(organization_id))
        with check (is_hr_or_admin(organization_id));
    $f$, t);
  end loop;
end$$;

-- onboarding_template_tasks doesn't have organization_id directly; bridge via template.
drop policy if exists "onboarding_template_tasks: members read" on onboarding_template_tasks;
drop policy if exists "onboarding_template_tasks: hr write" on onboarding_template_tasks;
create policy "ott: members read"
  on onboarding_template_tasks for select
  using (exists (select 1 from onboarding_templates t
                  where t.id = template_id and is_member_of(t.organization_id)));
create policy "ott: hr write"
  on onboarding_template_tasks for all
  using (exists (select 1 from onboarding_templates t
                  where t.id = template_id and is_hr_or_admin(t.organization_id)))
  with check (exists (select 1 from onboarding_templates t
                       where t.id = template_id and is_hr_or_admin(t.organization_id)));

-- -----------------------------------------------------------------------------
-- Employees: tighter rules. Self, manager-chain, or HR.
-- -----------------------------------------------------------------------------
create policy "employees: self / manager / hr"
  on employees for select
  using (
    is_hr_or_admin(organization_id)
    or user_id = auth.uid()
    or can_see_employee(id)
  );

create policy "employees: hr write"
  on employees for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));

-- Employees can update a small subset of their own fields (phone, address, emergency).
-- Enforced at the API layer with explicit allowlisted columns; DB policy below
-- permits the row update — column-level restriction must live in the application.
-- HARDENING: switch to a SECURITY DEFINER RPC that takes only the safe fields,
-- so the RLS update permission can be removed entirely from the employee role.
create policy "employees: self update"
  on employees for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Employment history mirrors employee visibility.
create policy "employment_records: visibility"
  on employment_records for select
  using (
    is_hr_or_admin(organization_id)
    or can_see_employee(employee_id)
  );
create policy "employment_records: hr write"
  on employment_records for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));

-- -----------------------------------------------------------------------------
-- Compensation: HR/admin only, plus the employee themselves seeing their OWN
-- compensation. Managers do NOT see comp by default.
-- -----------------------------------------------------------------------------
create policy "comp: hr or self"
  on compensation_records for select
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
  );
create policy "comp: hr write"
  on compensation_records for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));

-- -----------------------------------------------------------------------------
-- Documents: visibility column controls access.
-- -----------------------------------------------------------------------------
create policy "documents: read by visibility"
  on documents for select
  using (
    is_hr_or_admin(organization_id)
    or (
      visibility = 'company' and is_member_of(organization_id)
    )
    or (
      visibility in ('employee_and_hr','manager_chain')
      and employee_id is not null
      and (
        exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
        or (visibility = 'manager_chain' and can_see_employee(employee_id))
      )
    )
  );
create policy "documents: hr write"
  on documents for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));

create policy "policy_ack: self / hr"
  on policy_acknowledgments for select
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
  );
create policy "policy_ack: self insert"
  on policy_acknowledgments for insert
  with check (
    exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- Onboarding / offboarding tasks: subject employee, their manager chain, HR.
-- -----------------------------------------------------------------------------
create policy "onb_tasks: read"
  on onboarding_tasks for select
  using (
    is_hr_or_admin(organization_id)
    or assignee_user_id = auth.uid()
    or can_see_employee(employee_id)
  );
create policy "onb_tasks: hr or assignee write"
  on onboarding_tasks for all
  using (is_hr_or_admin(organization_id) or assignee_user_id = auth.uid())
  with check (is_hr_or_admin(organization_id) or assignee_user_id = auth.uid());

create policy "off_tasks: read"
  on offboarding_tasks for select
  using (
    is_hr_or_admin(organization_id)
    or assignee_user_id = auth.uid()
    or can_see_employee(employee_id)
  );
create policy "off_tasks: hr write"
  on offboarding_tasks for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));

-- -----------------------------------------------------------------------------
-- Time off & PTO: employee sees own, manager sees team, HR sees all.
-- -----------------------------------------------------------------------------
create policy "pto_balances: read"
  on pto_balances for select
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
    or can_see_employee(employee_id)
  );
create policy "pto_balances: hr write"
  on pto_balances for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));

create policy "time_off: read"
  on time_off_requests for select
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
    or can_see_employee(employee_id)
  );
create policy "time_off: employee insert own"
  on time_off_requests for insert
  with check (
    exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
  );
create policy "time_off: manager / hr update"
  on time_off_requests for update
  using (
    is_hr_or_admin(organization_id)
    or can_see_employee(employee_id)
  )
  with check (
    is_hr_or_admin(organization_id)
    or can_see_employee(employee_id)
  );

-- -----------------------------------------------------------------------------
-- Time entries
-- -----------------------------------------------------------------------------
create policy "time_entries: read"
  on time_entries for select
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
    or can_see_employee(employee_id)
  );
create policy "time_entries: employee write own"
  on time_entries for insert
  with check (
    exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
  );
create policy "time_entries: update self / approver"
  on time_entries for update
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
    or can_see_employee(employee_id)
  )
  with check (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
    or can_see_employee(employee_id)
  );

-- -----------------------------------------------------------------------------
-- Payroll: HR/admin only.
-- -----------------------------------------------------------------------------
create policy "payroll_exports: hr"
  on payroll_exports for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));
create policy "payroll_lines: hr"
  on payroll_export_lines for all
  using (exists (select 1 from payroll_exports pe
                  where pe.id = export_id and is_hr_or_admin(pe.organization_id)))
  with check (exists (select 1 from payroll_exports pe
                       where pe.id = export_id and is_hr_or_admin(pe.organization_id)));

-- -----------------------------------------------------------------------------
-- Recruiting
-- -----------------------------------------------------------------------------
-- Jobs are visible to all members (so internal mobility works); writes by HR/admin/recruiter.
create policy "jobs: members read"
  on jobs for select using (is_member_of(organization_id));
create policy "jobs: hr write"
  on jobs for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));

-- Candidates: HR/admin + the hiring manager + the recruiter on the job.
create policy "candidates: hiring team read"
  on candidates for select
  using (
    is_hr_or_admin(organization_id)
    or exists (
      select 1 from jobs j
      join employees e on e.id = j.hiring_manager_id or e.id = j.recruiter_id
      where j.id = candidates.job_id and e.user_id = auth.uid()
    )
  );
create policy "candidates: hr write"
  on candidates for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));

create policy "cand_notes: hiring team"
  on candidate_notes for select
  using (
    is_hr_or_admin(organization_id)
    or author_user_id = auth.uid()
  );
create policy "cand_notes: hiring team write"
  on candidate_notes for insert
  with check (is_member_of(organization_id));

create policy "interviews: hiring team"
  on interviews for select using (is_hr_or_admin(organization_id) or auth.uid() in (
    select u.id from users u join employees e on e.user_id = u.id
    where e.id = any(interviews.interviewer_employee_ids)
  ));
create policy "interviews: hr write"
  on interviews for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));

-- -----------------------------------------------------------------------------
-- Performance
-- -----------------------------------------------------------------------------
create policy "reviews: subject / reviewer / hr"
  on performance_reviews for select
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
    or exists (select 1 from employees e where e.id = reviewer_id and e.user_id = auth.uid())
  );
create policy "reviews: hr or reviewer write"
  on performance_reviews for all
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = reviewer_id and e.user_id = auth.uid())
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
  )
  with check (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = reviewer_id and e.user_id = auth.uid())
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
  );

create policy "goals: subject / manager / hr"
  on goals for select
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
    or can_see_employee(employee_id)
  );
create policy "goals: subject / manager / hr write"
  on goals for all
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
    or can_see_employee(employee_id)
  )
  with check (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())
    or can_see_employee(employee_id)
  );

create policy "1on1s: participants only"
  on one_on_ones for all
  using (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id in (manager_id, employee_id) and e.user_id = auth.uid())
  )
  with check (
    is_hr_or_admin(organization_id)
    or exists (select 1 from employees e where e.id in (manager_id, employee_id) and e.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- Workflows / approvals
-- -----------------------------------------------------------------------------
create policy "workflows: read"
  on workflows for select
  using (
    is_hr_or_admin(organization_id)
    or initiated_by = auth.uid()
    or exists (select 1 from workflow_steps ws where ws.workflow_id = workflows.id and ws.approver_user_id = auth.uid())
  );
create policy "workflows: write"
  on workflows for all
  using (is_member_of(organization_id))
  with check (is_member_of(organization_id));

create policy "workflow_steps: read"
  on workflow_steps for select
  using (exists (
    select 1 from workflows w where w.id = workflow_id
    and (is_hr_or_admin(w.organization_id) or w.initiated_by = auth.uid() or workflow_steps.approver_user_id = auth.uid())
  ));
create policy "workflow_steps: approver / hr write"
  on workflow_steps for update
  using (
    approver_user_id = auth.uid()
    or exists (select 1 from workflows w where w.id = workflow_id and is_hr_or_admin(w.organization_id))
  )
  with check (
    approver_user_id = auth.uid()
    or exists (select 1 from workflows w where w.id = workflow_id and is_hr_or_admin(w.organization_id))
  );

-- -----------------------------------------------------------------------------
-- Audit logs: read-only for HR/admin within their org. Writes happen via service role.
-- -----------------------------------------------------------------------------
create policy "audit: hr read"
  on audit_logs for select
  using (is_hr_or_admin(organization_id));

-- -----------------------------------------------------------------------------
-- AI conversations: a user only ever sees their own.
-- -----------------------------------------------------------------------------
create policy "ai_conv: own"
  on ai_conversations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_member_of(organization_id));

create policy "ai_msg: own conversation"
  on ai_messages for all
  using (exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- Integrations: HR/admin only.
-- -----------------------------------------------------------------------------
create policy "integrations: hr"
  on integrations for all
  using (is_hr_or_admin(organization_id))
  with check (is_hr_or_admin(organization_id));
