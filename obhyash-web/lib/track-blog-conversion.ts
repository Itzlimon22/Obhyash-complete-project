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

const recentEvents = new Map<string, number>();

/**
 * Button click conversion tracking — completely disabled to stop Vercel Serverless Function invocations
 * and keep CPU usage strictly within the Hobby tier.
 */
export function trackBlogConversion(_options: TrackConversionOptions) {
  // Disabled: no-op to eliminate serverless function CPU time
  return;
}
