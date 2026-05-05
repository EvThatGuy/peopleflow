import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server component / server action Supabase client.
 *
 * Reads the user's session from cookies. Honors RLS — every query is executed
 * as the authenticated user, so RLS policies in `0002_rls.sql` apply.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies are read-only there.
            // setAll is invoked from middleware/route handlers; safe to ignore here.
          }
        },
      },
    }
  );
}

/**
 * Service-role client for trusted server-side operations.
 *
 * Bypasses RLS. Use only for:
 *   - Tenant bootstrap (creating an organization + first membership)
 *   - Invite acceptance
 *   - Scheduled jobs / webhook handlers
 *   - Audit log writes
 *
 * NEVER use this from a client component or expose the key to the browser.
 */
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no-op */
        },
      },
    }
  );
}
