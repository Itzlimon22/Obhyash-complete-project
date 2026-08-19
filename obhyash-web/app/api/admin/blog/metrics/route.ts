import { NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/utils/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    await connection();

    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Subscriber Count
    const { count: subscriberCount, error: subError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true });

    if (subError) throw subError;

    // 2. Fetch Comments Count
    const { count: commentsCount, error: commentsError } = await supabaseAdmin
      .from('blog_comments')
      .select('*', { count: 'exact', head: true });

    if (commentsError) throw commentsError;

    // 3. Fetch Likes Count
    const { count: likesCount, error: likesError } = await supabaseAdmin
      .from('blog_likes')
      .select('*', { count: 'exact', head: true });

    if (likesError) throw likesError;

    return NextResponse.json({
      subscribers: subscriberCount || 0,
      comments: commentsCount || 0,
      likes: likesCount || 0,
    });
  } catch (error: any) {
    console.error('Error fetching blog metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
