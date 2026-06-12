import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_TIMEOUT_MS = 20000;

async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMessage: string,
  timeoutMs = AUTH_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request first
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Then rebuild the response with updated request and set cookies on it
          const updatedResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            updatedResponse.cookies.set(name, value, options),
          );
          supabaseResponse = updatedResponse;
        },
      },
    },
  );

  // We use getSession() instead of getUser() because Next.js prefetches can trigger
  // this middleware 20+ times concurrently on the Admin dashboard.
  // getUser() makes an API call every time, leading to rate limits and 429 errors.
  // getSession() decodes the JWT locally (0 API calls) unless it's expired.
  // Security is maintained because we fetch the profile from the DB below, which verifies the user.
  let user: { id: string } | null = null;
  try {
    const {
      data: { session },
    } = await withTimeout(
      supabase.auth.getSession(),
      'Session refresh timed out in middleware',
    );
    user = session?.user ?? null;
  } catch (error) {
    console.error('Middleware auth refresh error:', error);
  }

  // Define route types
  const { pathname } = request.nextUrl;
  const isRootRoute = pathname === '/';
  const isAdminRoute = pathname.startsWith('/admin');
  const isTeacherRoute = pathname.startsWith('/teacher');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  // All student tab paths that map into the SPA (including deep-link sub-paths)
  const STUDENT_TAB_PATHS = [
    '/dashboard', '/setup', '/history', '/practice', '/leaderboard',
    '/analysis', '/notifications', '/subscription', '/profile', '/settings',
    '/referral',
    // Deep links — dynamic sub-paths
    '/leaderboard/user', // /leaderboard/user/[userId]
  ];
  const isStudentRoute = STUDENT_TAB_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isProtectedRoute = isAdminRoute || isStudentRoute || isTeacherRoute;


  // SCENARIO A: Not logged in and trying to access a protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    // Copy cookies from supabaseResponse to the redirect response, preserving options
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set({ ...cookie, path: cookie.path ?? '/' });
    });
    return response;
  }

  // SCENARIO B: Logged in — fetch profile once for all role/status checks
  if (user && (isProtectedRoute || isAuthRoute || isRootRoute)) {
    let profile: { role?: string | null; status?: string | null } | null = null;

    // Fast-path: Check if we have a recently cached profile to avoid DB connection exhaustion
    const cachedCookie = request.cookies.get('obhyash_role_cache');
    if (cachedCookie?.value) {
      try {
        const parsed = JSON.parse(cachedCookie.value);
        if (parsed && parsed.role && parsed.userId === user.id) {
          profile = parsed;
        }
      } catch (e) {
        // ignore
      }
    }

    if (!profile) {
      try {
        const { data } = await withTimeout(
          supabase
            .from('users')
            .select('role, status')
            .eq('id', user.id)
            .single(),
          'Profile lookup timed out in middleware',
        );
        profile = data;
        
        // Cache the profile for 3 minutes to survive Next.js prefetch bursts
        if (profile) {
          supabaseResponse.cookies.set('obhyash_role_cache', JSON.stringify({
            userId: user.id,
            role: profile.role,
            status: profile.status
          }), { maxAge: 180, path: '/' });
        }
      } catch (error) {
        console.error('Middleware profile fetch error:', error);
      }
    }

    const role = (profile?.role ?? 'student').toLowerCase();
    const status = profile?.status ?? 'Active';
    const isInactive = status === 'Inactive' || status === 'Suspended';

    // Deactivated/suspended users get kicked out everywhere
    if (isInactive && pathname !== '/deactivated') {
      const response = NextResponse.redirect(
        new URL('/deactivated', request.url),
      );
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set({ ...cookie, path: cookie.path ?? '/' });
      });
      return response;
    }

    // Logged-in users visiting auth pages or the root get redirected to their dashboard
    if (isAuthRoute || isRootRoute) {
      const url = request.nextUrl.clone();

      if (role === 'admin') {
        url.pathname = '/admin/dashboard';
      } else if (role === 'teacher') {
        url.pathname = '/teacher/dashboard';
      } else {
        url.pathname = '/dashboard';
      }

      const response = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set({ ...cookie, path: cookie.path ?? '/' });
      });
      return response;
    }

    // Role-based route protection
    if (isAdminRoute && role !== 'admin') {
      const response = NextResponse.redirect(
        new URL('/dashboard', request.url),
      );
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set({ ...cookie, path: cookie.path ?? '/' });
      });
      return response;
    }

    if (isTeacherRoute && role !== 'teacher') {
      const response = NextResponse.redirect(
        new URL('/dashboard', request.url),
      );
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set({ ...cookie, path: cookie.path ?? '/' });
      });
      return response;
    }

    // Forward admins and teachers away from the student dashboard
    if (isStudentRoute && role === 'admin') {
      const response = NextResponse.redirect(
        new URL('/admin/dashboard', request.url),
      );
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set({ ...cookie, path: cookie.path ?? '/' });
      });
      return response;
    }

    if (isStudentRoute && role === 'teacher') {
      const response = NextResponse.redirect(
        new URL('/teacher/dashboard', request.url),
      );
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set({ ...cookie, path: cookie.path ?? '/' });
      });
      return response;
    }
  }

  // IMPORTANT: Always return supabaseResponse (not a plain NextResponse.next())
  // so that refreshed session cookies are forwarded to the browser.
  return supabaseResponse;
}
