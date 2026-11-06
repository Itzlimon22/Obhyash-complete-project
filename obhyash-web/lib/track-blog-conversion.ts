'use client';

export type BlogConversionEventType =
  | 'app_download'
  | 'signup_click'
  | 'login_click'
  | 'practice_click'
  | 'demo_exam_start'
  | 'demo_exam_complete';

export interface TrackConversionOptions {
  eventType: BlogConversionEventType;
  sourceSlug?: string;
  sourceCategory?: string;
  buttonLocation:
    | 'header'
    | 'drawer'
    | 'sidebar'
    | 'footer'
    | 'in_article'
    | 'floating_next'
    | 'quick_action'
    | 'mobile_sticky'
    | 'demo_ssc_start'
    | 'demo_hsc_start'
    | 'demo_exam_completed'
    | 'demo_gate_modal'
    | 'scholarship_card'
    | (string & {});
}

// In-memory debouncer to prevent duplicate clicks within 2 seconds
const recentEvents = new Map<string, number>();

/**
 * Button click conversion tracking — Active on Vercel Pro.
 * Tracks App downloads, Signups, Demo exams, and CTA clicks across blog articles.
 * Uses navigator.sendBeacon for zero-latency non-blocking network delivery.
 */
export function trackBlogConversion(options: TrackConversionOptions) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const key = `${options.eventType}:${options.sourceSlug || 'blog_home'}:${options.buttonLocation}`;
  const lastFired = recentEvents.get(key) || 0;

  // 2-second debounce per event/button
  if (now - lastFired < 2000) return;
  recentEvents.set(key, now);

  const payload = JSON.stringify({
    event_type: options.eventType,
    source_slug: options.sourceSlug || 'blog_home',
    source_category: options.sourceCategory || null,
    button_location: options.buttonLocation || 'unknown',
  });

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/blog/track-conversion', blob);
    } else {
      fetch('/api/blog/track-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-fatal tracking failure
  }
}
