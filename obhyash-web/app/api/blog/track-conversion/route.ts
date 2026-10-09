import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VALID_EVENT_TYPES = new Set([
  'app_download',
  'signup_click',
  'login_click',
  'practice_click',
  'demo_exam_start',
  'demo_exam_complete',
]);

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      // If sendBeacon used blob text
      const text = await req.text();
      body = JSON.parse(text);
    }

    const { event_type, source_slug, source_category, button_location } = body || {};

    if (!event_type || !VALID_EVENT_TYPES.has(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database unconfigured' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabaseAdmin.from('blog_conversions').insert({
      event_type,
      source_slug: String(source_slug || 'blog_home').slice(0, 200),
      source_category: source_category ? String(source_category).slice(0, 100) : null,
      button_location: button_location ? String(button_location).slice(0, 50) : 'unknown',
    });

    if (error) {
      // Graceful fallback if table not yet migrated
      if (error.code === '42P01') {
        return NextResponse.json({ success: false, warning: 'Table not migrated' });
      }
      console.error('Failed to log blog conversion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Track conversion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
