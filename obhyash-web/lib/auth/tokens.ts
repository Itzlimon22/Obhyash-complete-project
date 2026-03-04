/**
 * @fileoverview JWT signing and verification using the `jose` library.
 *
 * WHY `jose` instead of `jsonwebtoken`?
 * `jsonwebtoken` depends on Node.js crypto APIs and cannot run in the Edge Runtime.
 * Next.js Middleware runs on the Edge. `jose` uses the Web Crypto API, which is
 * available in Edge, Node.js, and browser environments — making it universal.
 */
import { SignJWT, jwtVerify, type JWTVerifyResult } from 'jose';
import type { JwtPayload, AuthCredentials } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * The cookie name used to store the JWT.
 * Defined as a constant here so every file imports from one source of truth
 * and a typo in one file cannot silently break auth in another.
 */
export const AUTH_COOKIE_NAME = 'obhyash_auth_token' as const;

/** How long the JWT (and its cookie) should stay valid. 7 days matches the Supabase default. */
export const SESSION_DURATION = '7d' as const;

/** Cookie max-age in seconds — must equal SESSION_DURATION numerically. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// ─── Secret Key ───────────────────────────────────────────────────────────────

/**
 * Reads the JWT_SECRET_KEY from the environment and encodes it as bytes.
 * Called on-demand (not at module load time) so it fails loudly at runtime
 * if the env var is missing, rather than failing silently at import time.
 *
 * Generate a suitable secret with:
 *   openssl rand -base64 32
 */
const getSecretKey = (): Uint8Array => {
  const rawSecret = process.env.JWT_SECRET_KEY;

  if (!rawSecret || rawSecret.length < 32) {
    throw new Error(
      'FATAL: JWT_SECRET_KEY env var is missing or too short (must be ≥ 32 chars). ' +
        'Generate one with: openssl rand -base64 32',
    );
  }

  // TextEncoder converts the UTF-8 string to bytes — required by jose's HMAC API.
  return new TextEncoder().encode(rawSecret);
};

// ─── Token Signing ────────────────────────────────────────────────────────────

/**
 * Creates and signs a new JWT containing the provided user credentials.
 *
 * @param credentials - The user data to embed in the token payload.
 * @returns A compact JWT string ready to be stored in a cookie.
 */
export const signJwt = async (
  credentials: AuthCredentials,
): Promise<string> => {
  const secretKey = getSecretKey();

  const signedToken = await new SignJWT({
    sub: credentials.sub,
    email: credentials.email,
    role: credentials.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    // setIssuedAt() stamps the token with the current time as `iat`.
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secretKey);

  return signedToken;
};

// ─── Token Verification ───────────────────────────────────────────────────────

/**
 * Verifies a JWT string and returns its decoded payload.
 *
 * WHY return `null` instead of throwing?
 * Every possible failure (expired, tampered signature, malformed, missing) should
 * result in exactly one outcome: treat the request as unauthenticated and redirect.
 * Callers should not need to wrap every call in try/catch.
 *
 * @param token - The raw JWT string extracted from the cookie.
 * @returns Verified payload, or `null` if verification fails for any reason.
 */
export const verifyJwt = async (token: string): Promise<JwtPayload | null> => {
  try {
    const secretKey = getSecretKey();

    const verificationResult: JWTVerifyResult = await jwtVerify(
      token,
      secretKey,
    );

    // Safe cast: we control the payload structure via `signJwt` above.
    return verificationResult.payload as unknown as JwtPayload;
  } catch {
    // Swallowing the error intentionally: we never want to expose details about
    // why verification failed (expired vs tampered) to anything that could be logged.
    return null;
  }
};
