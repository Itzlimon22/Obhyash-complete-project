import { NextResponse, connection } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/lib/utils/admin-auth';

export async function GET() {
  await connection();

  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const supabase = await createClient();

    // 1. Fetch Subscriber Count
    const { count: subscriberCount, error: subError } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true });

    if (subError) throw subError;

    // 2. Fetch Comments Count
    const { count: commentsCount, error: commentsError } = await supabase
      .from('blog_comments')
      .select('*', { count: 'exact', head: true });

    if (commentsError) throw commentsError;

    // 3. Fetch Likes Count
    const { count: likesCount, error: likesError } = await supabase
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
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
