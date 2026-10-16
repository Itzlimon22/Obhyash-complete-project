/**
 * Auth System Configuration
 *
 * Switch between the Auth UI experiences:
 * - 'minimal': The modern, unified 1-screen Login / Registration interface
 *              (Logo -> Mobile/Email -> Password -> Continue -> Google).
 * - 'classic': The original multi-step login and signup forms with full profile collection.
 *
 * You can also preview either system in the browser by appending:
 * ?mode=minimal  OR  ?mode=classic to /login and /signup URLs.
 */
export const AUTH_SYSTEM_MODE: 'minimal' | 'classic' = 'minimal';
