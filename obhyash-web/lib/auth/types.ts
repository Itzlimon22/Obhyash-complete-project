/**
 * @fileoverview Shared TypeScript interfaces for the JWT authentication system.
 * Centralising types prevents drift between Server Actions, Middleware, and components.
 */

/** The data payload encoded inside the JWT. Keep it minimal — it is sent on every request. */
export interface JwtPayload {
  /** The user's unique identifier from the database. */
  sub: string;
  /** The user's email address. */
  email: string;
  /** The user's role, used for fine-grained authorization checks. */
  role: 'Admin' | 'Teacher' | 'Student';
  /** JWT standard: issued-at timestamp (seconds since epoch). */
  iat: number;
  /** JWT standard: expiration timestamp (seconds since epoch). */
  exp: number;
}

/** Shape of the credentials required to issue a new JWT. */
export interface AuthCredentials {
  sub: string;
  email: string;
  role: JwtPayload['role'];
}

/** The return type of all Server Actions — provides consistent feedback to the UI. */
export interface ActionResult {
  success: boolean;
  error?: string;
}
