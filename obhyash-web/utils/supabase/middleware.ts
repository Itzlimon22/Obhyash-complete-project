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
    // Added teacher route
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Optional: Add ?next= param to redirect back after login
    // url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // SCENARIO B: Logged In -> Check Roles
  if (user) {
    // If accessing Auth routes while logged in, redirect to appropriate dashboard
    if (isAuthRoute) {
      // Fetch Role from DB to know where to send them
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'Student';

      const url = request.nextUrl.clone();
      if (role.toLowerCase() === 'admin') {
        url.pathname = '/admin/dashboard';
      } else if (role.toLowerCase() === 'teacher') {
        // Added teacher redirect
        url.pathname = '/teacher/dashboard';
      } else {
        url.pathname = '/dashboard';
      }
      return NextResponse.redirect(url);
    }

    // Check Role Access if already on protected route
    // Note: We avoid repetitive DB calls if possible, but middleware needs to be secure.
    // For performance, you might rely on layout checks, but middleware is safest.
    if (isAdminRoute || isStudentRoute || isTeacherRoute) {
      // Added teacher route
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'Student';

      // Protect Admin Area (case-insensitive)
      if (isAdminRoute && role.toLowerCase() !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Protect Teacher Area
      if (isTeacherRoute && role.toLowerCase() !== 'teacher') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Protect Student Area? (Usually admins can access everything, but if strict separation needed:)
      // if (isStudentRoute && role === 'Admin') { ... }
    }
  }

  return response;
}
