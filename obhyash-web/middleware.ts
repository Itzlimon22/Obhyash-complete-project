import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// 🔴 MAINTENANCE MODE SWITCH: Set to true to pause web traffic & show maintenance page (keeping /blog alive)
export const MAINTENANCE_MODE = true;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

    // 2. Return 503 for API routes to prevent database/CPU load
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'System undergoing scheduled upgrade. Please use the mobile app.' },
        { status: 503 }
      );
    }

    // 3. Rewrite all other web traffic to the black maintenance page with Play Store CTA
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

