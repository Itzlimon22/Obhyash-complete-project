/**
 * middleware.ts — Next.js Edge Middleware
 *
 * This file MUST be named `middleware.ts` and live at the project root.
 * Next.js will silently ignore any other filename (e.g. proxy.ts).
 *
 * Purpose: On every request, call updateSession() which:
 *  1. Calls supabase.auth.getUser() server-side to validate the JWT.
 *  2. Refreshes the Supabase session cookie if the access token has expired.
 *  3. Writes the fresh cookie back to the browser response.
 *
 * Without this, the session cookie silently expires and all DB queries fail,
 * causing blank data / infinite loading spinners for both admin and user panels.
 */
import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images, icons, manifests, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest\\.json)$).*)',
  ],
};
