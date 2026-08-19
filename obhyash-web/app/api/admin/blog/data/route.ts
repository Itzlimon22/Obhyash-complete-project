import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/utils/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Fetch all comments or subscribers securely with search and pagination
export async function GET(request: NextRequest) {
  try {
    await connection();

    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'comments' or 'subscribers'
    const search = searchParams.get('search')?.trim();

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (type === 'subscribers') {
      let query = supabaseAdmin
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.ilike('email', `%${search}%`);
      }

      const { data, error, count } = await query
        .order('subscribed_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return NextResponse.json({ data: data || [], totalCount: count || 0 });
    }

    if (type === 'comments') {
      let query = supabaseAdmin
        .from('blog_comments')
        .select('*', { count: 'exact' });

      if (search) {
        // Also search user matching name or email
        const { data: matchedUsers } = await supabaseAdmin
          .from('users')
          .select('id')
          .or(`name.ilike.%${search}%,email.ilike.%${search}%`);

        const matchedUserIds = (matchedUsers || []).map((u: any) => u.id);

        if (matchedUserIds.length > 0) {
          query = query.or(
            `content.ilike.%${search}%,post_slug.ilike.%${search}%,user_id.in.(${matchedUserIds.join(',')})`,
          );
        } else {
          query = query.or(
            `content.ilike.%${search}%,post_slug.ilike.%${search}%`,
          );
        }
      }

      const { data: rawComments, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Hydrate users
      const userIds = Array.from(
        new Set((rawComments || []).map((c) => c.user_id).filter(Boolean)),
      );

      let userMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', userIds);

        (usersData || []).forEach((u) => {
          userMap[u.id] = u;
        });
      }

      const enriched = (rawComments || []).map((c) => ({
        ...c,
        user: userMap[c.user_id] || null,
      }));

      return NextResponse.json({ data: enriched, totalCount: count || 0 });
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('Error fetching admin blog data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// Delete a comment or subscriber
export async function DELETE(request: NextRequest) {
  try {
    await connection();

    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const { id, type = 'comment' } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Target ID required' },
        { status: 400 },
      );
    }

    if (type === 'subscriber') {
      const { error } = await supabaseAdmin
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Subscriber removed successfully',
      });
    }

    // Default: comment
    const { error } = await supabaseAdmin
      .from('blog_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting admin blog item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: 500 },
    );
  }
}
