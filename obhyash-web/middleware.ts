import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Completely bypass ALL API routes (API routes handle their own auth & server logic)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2. Completely bypass auth checks & serverless session logic for public blog routes and static info
  if (
    pathname.startsWith('/blog') ||
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
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (ALL api routes - API routes handle their own auth)
     * - blog (all blog pages and subpaths)
     * - demo (public demo exam platform)
     * - public info: faq, privacy, terms, refund, about-us
     * - public assets (svg, png, jpg, webp, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api(?:/.*)?$|blog(?:/.*)?$|demo(?:/.*)?$|faq$|privacy$|terms$|refund$|about-us$|sitemap.*|robots\\.txt$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest\\.json)$).*)',
  ],
};

