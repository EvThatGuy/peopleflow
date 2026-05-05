/**
 * Pure role type and label exports — safe to import from client components.
 *
 * The full session machinery (`getSession`, `createClient`) lives in
 * `./session.ts` which imports `next/headers` and is server-only. Splitting
 * the constants here lets `<TopBar />` and other client components reference
 * role labels without dragging the server module into the client bundle.
 */

export type AppRole =
  | 'super_admin'
  | 'company_admin'
  | 'hr_manager'
  | 'manager'
  | 'employee'
  | 'candidate';

export const roleLabels: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  company_admin: 'Company Admin',
  hr_manager: 'HR Manager',
  manager: 'Manager',
  employee: 'Employee',
  candidate: 'Candidate',
};

const HR_ROLES: AppRole[] = ['super_admin', 'company_admin', 'hr_manager'];
const MANAGER_OR_ABOVE: AppRole[] = [...HR_ROLES, 'manager'];

/**
 * RBAC capability predicates. Pure functions over the role enum.
 * The *real* enforcement is in PostgreSQL RLS — these are convenience helpers
 * the UI uses to show/hide controls. If a developer forgets a `can` check,
 * RLS still blocks the action; the user just sees a button that does nothing.
 */
export const can = {
  viewCompensation: (role: AppRole) => HR_ROLES.includes(role),
  manageEmployees: (role: AppRole) => HR_ROLES.includes(role),
  manageJobs: (role: AppRole) => HR_ROLES.includes(role),
  approveTimeOff: (role: AppRole) => MANAGER_OR_ABOVE.includes(role),
  viewAuditLogs: (role: AppRole) => HR_ROLES.includes(role),
  manageIntegrations: (role: AppRole) =>
    role === 'company_admin' || role === 'super_admin',
  manageBilling: (role: AppRole) =>
    role === 'company_admin' || role === 'super_admin',
  inviteUsers: (role: AppRole) => HR_ROLES.includes(role),
  manageSettings: (role: AppRole) => HR_ROLES.includes(role),
};
