/**
 * @fileoverview Server-side helper to get the currently authenticated user.
 *
 * Import `getCurrentUser` in any Server Component, Server Action, or Route Handler
 * to access the verified user without making a database query — the data lives in the JWT.
 *
 * Usage:
 * ```ts
 * import { getCurrentUser } from '@/lib/auth/session';
 *
 * const currentUser = await getCurrentUser();
 * if (!currentUser) redirect('/login');
 *
 * console.log(currentUser.email); // e.g. "admin@example.com"
 * console.log(currentUser.role);  // e.g. "Admin"
 * ```
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME, verifyJwt } from './tokens';
import type { JwtPayload } from './types';

// ─── getCurrentUser ───────────────────────────────────────────────────────────

/**
 * Reads the auth cookie, verifies the JWT, and returns the decoded user payload.
 * Returns `null` if there is no session or the token is invalid/expired.
 * Does NOT redirect — gives the caller the choice of how to handle `null`.
 *
 * @returns Verified JWT payload, or `null` for unauthenticated requests.
 */
export const getCurrentUser = async (): Promise<JwtPayload | null> => {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  // Early return: no cookie means no session.
  if (!rawToken) return null;

  return verifyJwt(rawToken);
};

// ─── requireUser ─────────────────────────────────────────────────────────────

/**
 * Like `getCurrentUser`, but redirects to `/login` if the session is absent or invalid.
 * Use this in Server Components where an unauthenticated state is never acceptable.
 *
 * @returns Guaranteed non-null JWT payload.
 */
export const requireUser = async (): Promise<JwtPayload> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  return currentUser;
};

// ─── requireRole ─────────────────────────────────────────────────────────────

/**
 * Like `requireUser`, but additionally enforces a specific role.
 * Redirects to `/dashboard` if the user's role does not match.
 *
 * @param requiredRole - The role that is allowed to access this resource.
 * @returns Guaranteed non-null JWT payload with the correct role.
 *
 * @example
 * // In an admin server component:
 * const adminUser = await requireRole('Admin');
 */
export const requireRole = async (
  requiredRole: JwtPayload['role'],
): Promise<JwtPayload> => {
  const currentUser = await requireUser();

  if (currentUser.role !== requiredRole) {
    // WHY redirect to /dashboard instead of /403?
    // Silently redirect rather than confirming that the resource exists.
    // This is the "security through obscurity" defense for admin routes.
    redirect('/dashboard');
  }

  return currentUser;
};
