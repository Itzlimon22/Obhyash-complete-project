import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
     * Only run middleware on protected app routes and auth flows.
     * All public traffic (home, blog, notes, static info, assets, api)
     * completely bypasses middleware execution, ensuring 0ms CPU time.
     */
    '/admin/:path*',
    '/teacher/:path*',
    '/dashboard/:path*',
    '/setup/:path*',
    '/history/:path*',
    '/practice/:path*',
    '/leaderboard/:path*',
    '/analysis/:path*',
    '/notifications/:path*',
    '/subscription/:path*',
    '/upgrade/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/referral/:path*',
    '/complaint/:path*',
    '/feature-requests/:path*',
    '/bookmarks/:path*',
    '/account-info/:path*',
    '/account-linking/:path*',
    '/info/:path*',
    '/legends-league/:path*',
    '/legends_league/:path*',
    '/live_exam/:path*',
    '/live-exam/:path*',
    '/exam/:path*',
    '/question-bank/:path*',
    '/personal/:path*',
    '/login',
    '/signup',
    '/register',
    '/auth/:path*',
    '/onboarding',
    '/deactivated',
  ],
};

