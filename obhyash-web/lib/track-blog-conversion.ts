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

/**
 * Lightweight, non-blocking beacon to track blog reader conversions
 * (e.g. clicking Play Store download, registration, or login)
 */
export function trackBlogConversion({
  eventType,
  sourceSlug = 'blog_home',
  sourceCategory = 'General',
  buttonLocation,
}: TrackConversionOptions) {
  if (typeof window === 'undefined') return;

  try {
    const payload = JSON.stringify({
      event_type: eventType,
      source_slug: sourceSlug,
      source_category: sourceCategory,
      button_location: buttonLocation,
    });

    // Use navigator.sendBeacon for fast, reliable, non-blocking delivery even during page navigation
    if (navigator.sendBeacon) {
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
  } catch (error) {
    // Non-blocking fail-safe
  }
}
