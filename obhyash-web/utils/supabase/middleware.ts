import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Always call getUser() to refresh the session cookie if needed.
  // Never use getSession() here — it doesn't validate the token server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    return NextResponse.redirect(url);
  }

  // SCENARIO B: Logged in — fetch profile once for all role/status checks
  if (user && (isProtectedRoute || isAuthRoute)) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    const role = (profile?.role ?? 'student').toLowerCase();
    const status = profile?.status ?? 'Active';
    const isInactive = status === 'Inactive' || status === 'Suspended';

    // Deactivated/suspended users get kicked out everywhere
    if (isInactive && pathname !== '/deactivated') {
      return NextResponse.redirect(new URL('/deactivated', request.url));
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

      return NextResponse.redirect(url);
    }

    // Role-based route protection
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isTeacherRoute && role !== 'teacher') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // IMPORTANT: Always return supabaseResponse (not a plain NextResponse.next())
  // so that refreshed session cookies are forwarded to the browser.
  return supabaseResponse;
}
