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

  // IMPORTANT: Always call getUser() to refresh the session cookie if needed.
  // Never use getSession() here — it doesn't validate the token server-side.
  let user: { id: string } | null = null;
  try {
    const {
      data: { user: authUser },
    } = await withTimeout(
      supabase.auth.getUser(),
      'Session refresh timed out in middleware',
    );
    user = authUser;
  } catch (error) {
    console.error('Middleware auth refresh error:', error);
  }

  // Define route types
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin');
  const isStudentRoute = pathname.startsWith('/dashboard');
  const isTeacherRoute = pathname.startsWith('/teacher');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isProtectedRoute = isAdminRoute || isStudentRoute || isTeacherRoute;

  // SCENARIO A: Not logged in and trying to access a protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    // Copy cookies from supabaseResponse to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  }

  // SCENARIO B: Logged in — fetch profile once for all role/status checks
  if (user && (isProtectedRoute || isAuthRoute)) {
    let profile: { role?: string | null; status?: string | null } | null = null;

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
    } catch (error) {
      console.error('Middleware profile fetch error:', error);
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
        response.cookies.set(cookie);
      });
      return response;
    }

    // Logged-in users visiting auth pages get redirected to their dashboard
    if (isAuthRoute) {
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
        response.cookies.set(cookie);
      });
      return response;
    }

    // Role-based route protection
    if (isAdminRoute && role !== 'admin') {
      const response = NextResponse.redirect(
        new URL('/dashboard', request.url),
      );
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie);
      });
      return response;
    }

    if (isTeacherRoute && role !== 'teacher') {
      const response = NextResponse.redirect(
        new URL('/dashboard', request.url),
      );
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie);
      });
      return response;
    }
  }

  // IMPORTANT: Always return supabaseResponse (not a plain NextResponse.next())
  // so that refreshed session cookies are forwarded to the browser.
  return supabaseResponse;
}
