import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });

          // Refreshed session, create new response
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 1. Get User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Define Paths
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isStudentRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isTeacherRoute = request.nextUrl.pathname.startsWith('/teacher'); // Added
  const isAuthRoute = ['/login', '/signup'].includes(request.nextUrl.pathname);

  // 3. Security Checks

  // SCENARIO A: Not Logged In -> Kick to Login
  if (!user && (isAdminRoute || isStudentRoute || isTeacherRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Use the base response to ensure cookies are carried over
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // SCENARIO B: Logged In -> Check Roles
  if (user) {
    // If accessing Auth routes while logged in, redirect to appropriate dashboard
    if (isAuthRoute) {
      const { data: profile } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'Student';
      const status = profile?.status || 'Active';
      const url = request.nextUrl.clone();

      if (status === 'Inactive' || status === 'Suspended') {
        url.pathname = '/deactivated';
      } else if (role.toLowerCase() === 'admin') {
        url.pathname = '/admin/dashboard';
      } else if (role.toLowerCase() === 'teacher') {
        url.pathname = '/teacher/dashboard';
      } else {
        url.pathname = '/dashboard';
      }

      const redirectResponse = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }

    // Role-based protection
    if (isAdminRoute || isStudentRoute || isTeacherRoute) {
      const { data: profile } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'Student';
      const status = profile?.status || 'Active';

      // ENFORCE STATUS CHECK
      if (status === 'Inactive' || status === 'Suspended') {
        const redirectResponse = NextResponse.redirect(
          new URL('/deactivated', request.url),
        );
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
      }

      if (isAdminRoute && role.toLowerCase() !== 'admin') {
        const redirectResponse = NextResponse.redirect(
          new URL('/dashboard', request.url),
        );
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
      }

      if (isTeacherRoute && role.toLowerCase() !== 'teacher') {
        const redirectResponse = NextResponse.redirect(
          new URL('/dashboard', request.url),
        );
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
      }
    }
  }

  return response;
}
