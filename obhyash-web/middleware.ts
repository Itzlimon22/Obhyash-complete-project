import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// 🔴 MAINTENANCE MODE SWITCH: Set to false to resume normal web traffic
export const MAINTENANCE_MODE = false;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If user visits /maintenance while maintenance mode is off, redirect to home
  if (!MAINTENANCE_MODE && pathname === '/maintenance') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ─── MAINTENANCE MODE ENFORCEMENT ──────────────────────────────────────────
  if (MAINTENANCE_MODE) {
    // 1. Keep /blog completely active & accessible for viral traffic & SEO
    if (
      pathname.startsWith('/blog') ||
      pathname === '/maintenance' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml'
    ) {
      return NextResponse.next();
    }

    // 2. Admin Panel & Admin APIs exemption: Keep Admin panel and auth fully accessible
    const isAdminRoute = pathname.startsWith('/admin');
    const isAdminApi = pathname.startsWith('/api/admin');
    const isAuthRoute =
      pathname.startsWith('/auth') ||
      pathname === '/login' ||
      pathname.startsWith('/api/auth');

    if (isAdminApi) {
      return NextResponse.next();
    }

    if (isAdminRoute || isAuthRoute) {
      return await updateSession(request);
    }

    // 3. Return 503 for all other API routes to prevent database/CPU load
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'System undergoing scheduled upgrade. Please use the mobile app.' },
        { status: 503 }
      );
    }

    // 4. Rewrite all other web traffic to the black maintenance page with Play Store CTA
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  // ─── NORMAL OPERATION (MAINTENANCE_MODE = false) ───────────────────────────
  // 1. Completely bypass ALL API routes (API routes handle their own auth & server logic)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2. Completely bypass auth checks & serverless session logic for public pages and static info
  if (
    pathname.startsWith('/blog') ||
    pathname.startsWith('/notes') ||
    pathname.startsWith('/demo') ||
    pathname === '/faq' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/refund' ||
    pathname === '/about-us' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets:
     * - _next/static, _next/image
     * - favicon.ico, icon-*, images/
     */
    '/((?!_next/static|_next/image|favicon.ico|icon-.*|images/.*).*)',
  ],
};

