import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Completely bypass auth checks & serverless session logic for public blog routes and static info
  if (
    pathname.startsWith('/blog') ||
    pathname.startsWith('/api/blog') ||
    pathname.startsWith('/demo') ||
    pathname === '/faq' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/refund' ||
    pathname === '/about-us'
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
     * - blog (all blog pages and subpaths)
     * - api/blog (blog API routes)
     * - demo (public demo exam platform)
     * - public info: faq, privacy, terms, refund, about-us
     * - public assets (svg, png, jpg, webp, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|blog(?:/.*)?$|api/blog(?:/.*)?$|demo(?:/.*)?$|faq$|privacy$|terms$|refund$|about-us$|sitemap.*|robots\\.txt$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest\\.json)$).*)',
  ],
};
