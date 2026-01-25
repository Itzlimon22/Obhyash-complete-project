import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Create an initial response (we will modify this)
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
            // ✅ Update the Request (so Server Components see it immediately)
            request.cookies.set(name, value);
          });
          
          // ✅ Update the Response (so the Browser sees it)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 2. Check Auth Status
  // Using getUser() is safer than getSession() as it validates the token with Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Define Protected Routes
  const isLoginPage = request.nextUrl.pathname === '/login';
  
  // If User is NOT logged in and trying to access a protected page
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If User IS logged in and trying to access the Login page
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. Return the response object (which wraps the cookies)
  return response;
}

export const config = {
  // Optimized matcher to ignore static files, images, and API routes if needed
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};