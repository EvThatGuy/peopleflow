import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase session on every request and gates `/app/*` routes
 * behind authentication. Demo mode (env flag) bypasses the auth check so
 * the seeded Northwind tenant is browsable without setting up real auth.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAppRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/people')
    || pathname.startsWith('/org-chart') || pathname.startsWith('/onboarding')
    || pathname.startsWith('/offboarding') || pathname.startsWith('/time-off')
    || pathname.startsWith('/time-tracking') || pathname.startsWith('/compensation')
    || pathname.startsWith('/recruiting') || pathname.startsWith('/performance')
    || pathname.startsWith('/documents') || pathname.startsWith('/workflows')
    || pathname.startsWith('/assistant') || pathname.startsWith('/analytics')
    || pathname.startsWith('/settings');

  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (isAppRoute && !user && !demoMode) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets and image optimization.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
