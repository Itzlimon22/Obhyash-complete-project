/**
 * Simple in-memory rate limiter.
 * Works per Next.js process instance — good enough for single-server or
 * low-traffic deployments. For multi-instance/edge, swap the Map for
 * Upstash Redis (drop-in replacement).
 */

interface Entry {
  count: number;
  reset: number; // epoch ms when the window resets
}

const store = new Map<string, Entry>();

// Prune stale entries every 5 minutes to avoid memory leaks
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.reset) store.delete(key);
    }
  },
  5 * 60 * 1000,
);

/**
 * @param key      Unique identifier — typically `${userId}:${route}` or `${ip}:${route}`
 * @param limit    Max requests allowed in the window (default 20)
 * @param windowMs Window size in milliseconds (default 60 s)
 * @returns `{ allowed: boolean, remaining: number, resetAt: number }`
 */
export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.reset };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.reset,
  };
}

/** Convenience: returns a 429 Response if the key is rate-limited. */
export function rateLimitResponse(key: string, limit = 20, windowMs = 60_000) {
  const result = rateLimit(key, limit, windowMs);
  if (!result.allowed) {
    return {
      limited: true,
      response: new Response(
        JSON.stringify({ error: 'Too many requests. Please slow down.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(
              Math.ceil((result.resetAt - Date.now()) / 1000),
            ),
          },
        },
      ),
    } as const;
  }
  return { limited: false, response: null } as const;
}
