import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

/**
 * Next.js root middleware.
 *
 * This runs on EVERY matched request before the page renders.
 * It delegates to updateSession() which:
 *  1. Reads the Supabase session cookie
 *  2. Silently refreshes the JWT if it's expired (so users stay logged in)
 *  3. Writes the refreshed cookie back to the response
 *  4. Handles role-based redirects (student → /dashboard, admin → /admin/dashboard, etc.)
 *
 * Without this file, session refresh never happens server-side and users
 * get logged out on refresh or after the JWT expires (~1 hour).
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match ALL paths EXCEPT:
     *  - _next/static  (Next.js build assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico   (browser favicon)
     *  - Files with extensions (e.g. .png, .svg, .js)
     *
     * This ensures the middleware runs on every page and API route
     * so the session cookie is always refreshed when needed.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
};
