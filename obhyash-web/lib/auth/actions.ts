/**
 * @fileoverview Next.js Server Actions for login and logout.
 *
 * WHY Server Actions instead of API Routes?
 * 1. The JWT secret key (JWT_SECRET_KEY) never appears in the client bundle.
 * 2. Next.js validates the `Origin` header on Server Actions, providing CSRF
 *    protection for free — no csrf tokens needed in forms.
 * 3. They integrate natively with React's <form action={...}> pattern,
 *    enabling logout/login to work even without JavaScript (progressive enhancement).
 *
 * IMPORTANT: `redirect()` in Next.js throws internally to interrupt execution.
 * It must NEVER be inside a try/catch block, otherwise the redirect is swallowed.
 */
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signJwt,
} from '@/lib/auth/tokens';
import type { ActionResult, AuthCredentials } from '@/lib/auth/types';

// ─── Core Helper: Issue Session ───────────────────────────────────────────────

/**
 * Signs a JWT for the given credentials and sets it as an HttpOnly cookie.
 * Call this from your login action once credentials are verified.
 *
 * @param credentials - Verified user data to embed in the JWT.
 */
export const issueSession = async (
  credentials: AuthCredentials,
): Promise<void> => {
  const jwtToken = await signJwt(credentials);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, jwtToken, {
    // WHY httpOnly? JavaScript (including XSS payloads) CANNOT read httpOnly cookies.
    // This is the single most important XSS mitigation for token-based auth.
    httpOnly: true,

    // WHY secure? Forces HTTPS in production. Never accept the token over plain HTTP.
    secure: process.env.NODE_ENV === 'production',

    // WHY sameSite: 'lax'?
    // 'strict' would break OAuth redirects and email confirmation links.
    // 'none' would allow cross-site requests (CSRF risk).
    // 'lax' is the sweet spot: blocks cross-site POST (CSRF) while allowing
    // top-level GET navigations from external sites.
    sameSite: 'lax',

    // WHY maxAge instead of not setting it?
    // Without maxAge the browser creates a "session cookie" that disappears when
    // the browser is closed — defeating the "stay logged in" requirement.
    // With maxAge, the cookie is persisted to disk and survives browser restarts.
    maxAge: SESSION_MAX_AGE_SECONDS,

    // Scoped to the entire site, not just one path.
    path: '/',
  });
};

// ─── Logout Action ────────────────────────────────────────────────────────────

/**
 * Destroys the current session by deleting the auth cookie.
 * Wire this to a form: <form action={logoutAction}><button>Sign out</button></form>
 */
export const logoutAction = async (): Promise<void> => {
  const cookieStore = await cookies();

  // Deleting the cookie is all that is needed for a stateless JWT system.
  // The token may still be technically valid at the Supabase level until it expires,
  // but once the cookie is gone the browser will never send it again.
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete('obhyash_user_profile'); // Clear the client-side profile cache

  // Redirect is called OUTSIDE try/catch (it throws to interrupt execution).
  redirect('/login');
};

// ─── Demo Login Action (replace with your Supabase auth flow) ────────────────

/**
 * Example standalone login action that issues a JWT after credential verification.
 * In your app, replace `verifyUserCredentials()` with a Supabase auth check.
 *
 * @param formData - Raw FormData from the login form.
 * @returns ActionResult with success flag and optional error message.
 */
export const standaloneLoginAction = async (
  formData: FormData,
): Promise<ActionResult> => {
  const rawEmail = formData.get('email');
  const rawPassword = formData.get('password');

  // Early return: ensure fields exist and are strings before processing.
  if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
    return { success: false, error: 'Invalid form submission.' };
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();
  const password = rawPassword;

  if (!normalizedEmail || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  // ── Replace this with your actual DB credential check ──────────────────────
  // Example with Supabase client auth:
  //
  // const supabase = createClient();
  // const { data, error } = await supabase.auth.signInWithPassword({
  //   email: normalizedEmail,
  //   password,
  // });
  // if (error || !data.user) {
  //   return { success: false, error: 'Invalid email or password.' };
  // }
  // const verifiedUser = { sub: data.user.id, email: data.user.email!, role: data.user.... };
  // ──────────────────────────────────────────────────────────────────────────

  const verifiedUser = await verifyUserCredentials(normalizedEmail, password);

  if (!verifiedUser) {
    // Generic error intentionally — never reveal whether it was the email or
    // password that was wrong (prevents user enumeration attacks).
    return { success: false, error: 'Invalid email or password.' };
  }

  // Issue the JWT cookie.
  await issueSession(verifiedUser);

  // Redirect is OUTSIDE try/catch — it throws internally.
  redirect('/admin/dashboard');
};

// ─── Placeholder credential verifier ─────────────────────────────────────────

/**
 * PLACEHOLDER — replace with your actual database lookup + bcrypt comparison.
 * Never store plaintext passwords. Use bcrypt or argon2.
 */
const verifyUserCredentials = async (
  email: string,
  _password: string,
): Promise<AuthCredentials | null> => {
  // In production replace this with your DB query:
  // const user = await prisma.user.findUnique({ where: { email } });
  // const isMatch = await bcrypt.compare(password, user.passwordHash);
  // if (!isMatch) return null;
  // return { sub: user.id, email: user.email, role: user.role };

  void email; // suppress unused-variable lint warning during scaffold
  return null; // Always returns null until you wire up a real DB
};
