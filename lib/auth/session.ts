import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { AppRole } from './roles';

export type { AppRole } from './roles';
export { roleLabels, can } from './roles';

export type SessionContext = {
  userId: string;
  email: string;
  fullName: string | null;
  organizationId: string;
  organizationName: string;
  role: AppRole;
  employeeId: string | null;
  isDemo: boolean;
};

/**
 * In demo mode we hard-code a session to the seeded Northwind admin so the
 * app is fully browsable without configuring auth. This is the ONLY place
 * where demo-mode bypass should live.
 */
const DEMO_SESSION: SessionContext = {
  userId: '00000000-0000-0000-0000-00000000aaaa',
  email: 'marina.vasquez@northwind.example',
  fullName: 'Marina Vasquez',
  organizationId: '00000000-0000-0000-0000-00000000a001',
  organizationName: 'Northwind Logistics',
  role: 'company_admin',
  employeeId: '00000000-0000-0000-0000-00000000e001',
  isDemo: true,
};

/**
 * Returns the current session context, including tenant and role.
 * `cache()` so RSCs in the same render share one DB roundtrip.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return DEMO_SESSION;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Look up the active org from the users table; fall back to first membership.
  const { data: userRow } = await supabase
    .from('users')
    .select('full_name, active_org_id')
    .eq('id', user.id)
    .single();

  let organizationId = userRow?.active_org_id ?? null;
  let role: AppRole | null = null;
  let organizationName = '';

  if (organizationId) {
    const { data: m } = await supabase
      .from('memberships')
      .select('role, organizations(name)')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .single();
    if (m) {
      role = m.role as AppRole;
      organizationName = (m.organizations as any)?.name ?? '';
    }
  }

  if (!organizationId || !role) {
    const { data: first } = await supabase
      .from('memberships')
      .select('organization_id, role, organizations(name)')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    if (first) {
      organizationId = first.organization_id;
      role = first.role as AppRole;
      organizationName = (first.organizations as any)?.name ?? '';
    }
  }

  if (!organizationId || !role) return null;

  // Resolve employee record (may be null for super_admin or pure-candidate accounts)
  const { data: emp } = await supabase
    .from('employees')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? '',
    fullName: userRow?.full_name ?? user.email ?? null,
    organizationId,
    organizationName,
    role,
    employeeId: emp?.id ?? null,
    isDemo: false,
  };
});

export async function requireSession(): Promise<SessionContext> {
  const s = await getSession();
  if (!s) throw new Error('UNAUTHENTICATED');
  return s;
}
