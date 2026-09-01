/**
 * Device fingerprint generator for anti-fraud and device-level referral lock.
 * Persists across sessions using localStorage and long-lived cookies.
 */

export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';

  const STORAGE_KEY = 'obhyash_device_fingerprint';

  // 1. Try reading from localStorage
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached && cached.startsWith('dev_web_')) {
      return cached;
    }
  } catch (_) {}

  // 2. Try reading from document.cookie
  try {
    const match = document.cookie.match(new RegExp(`(^| )${STORAGE_KEY}=([^;]+)`));
    if (match && match[2] && match[2].startsWith('dev_web_')) {
      try {
        localStorage.setItem(STORAGE_KEY, match[2]);
      } catch (_) {}
      return match[2];
    }
  } catch (_) {}

  // 3. Generate a robust hardware & browser fingerprint hash
  let entropy = '';
  try {
    const nav = window.navigator;
    const scr = window.screen;
    entropy = [
      nav.userAgent || '',
      nav.language || '',
      scr.width || '',
      scr.height || '',
      scr.colorDepth || '',
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      (nav as unknown as { hardwareConcurrency?: number }).hardwareConcurrency || '',
    ].join('###');
  } catch (_) {}

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < entropy.length; i++) {
    const char = entropy.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hashHex = Math.abs(hash).toString(16);

  // Generate unique suffix
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  const newDeviceId = `dev_web_${hashHex}_${timePart}_${randomPart}`;

  // Store in localStorage & Cookie (10 years)
  try {
    localStorage.setItem(STORAGE_KEY, newDeviceId);
  } catch (_) {}

  try {
    const maxAge = 10 * 365 * 24 * 60 * 60; // 10 years
    document.cookie = `${STORAGE_KEY}=${newDeviceId}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch (_) {}

  return newDeviceId;
}
