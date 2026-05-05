import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const APP_ROUTE_PREFIXES = [
  '/dashboard',
  '/people',
  '/org-chart',
  '/onboarding',
  '/offboarding',
  '/time-off',
  '/time-tracking',
  '/compensation',
  '/recruiting',
  '/performance',
  '/documents',
  '/workflows',
  '/assistant',
  '/analytics',
  '/settings',
];

function isProtectedPath(pathname: string) {
  return APP_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  // Public routes never touch Supabase — a misconfigured env or transient
  // auth outage must not be able to 500 /login, /signup, or /.
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Bare assertions used to crash the Edge runtime (MIDDLEWARE_INVOCATION_FAILED)
  // when these were unset for the deployed environment. Fail loud but cleanly.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'middleware: missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
    return new NextResponse('Service misconfigured', { status: 503 });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  });

  let user: { id: string } | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    // Treat any auth failure as unauthenticated — safer than crashing the
    // request, and the redirect below sends the user somewhere usable.
    console.error('middleware: supabase.auth.getUser failed', error);
  }

  if (!user) {
    return redirectToLogin(request);
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
