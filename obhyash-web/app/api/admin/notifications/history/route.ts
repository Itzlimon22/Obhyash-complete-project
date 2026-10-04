import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const search = searchParams.get('search')?.trim() || '';
    const type = searchParams.get('type') || 'all';
    const readStatus = searchParams.get('readStatus') || 'all';
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // If searching, check if search matches users first to include their IDs
    let matchedUserIds: string[] = [];
    if (search) {
      try {
        const { data: matchedUsers } = await supabaseAdmin
          .from('users')
          .select('id')
          .or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
          .limit(50);

        if (matchedUsers && matchedUsers.length > 0) {
          matchedUserIds = matchedUsers.map((u: any) => u.id);
        }
      } catch (uErr) {
        console.warn('User search match error:', uErr);
      }
    }

    // Base query for notifications
    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (type && type !== 'all') {
      if (type.startsWith('prefix:')) {
        const prefix = type.replace('prefix:', '');
        query = query.ilike('type', `${prefix}%`);
      } else {
        query = query.eq('type', type);
      }
    }

    if (readStatus === 'read') {
      query = query.eq('is_read', true);
    } else if (readStatus === 'unread') {
      query = query.eq('is_read', false);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply search filter (title, body, or matched user_ids)
    if (search) {
      if (matchedUserIds.length > 0) {
        // Match either notification text OR matched user IDs
        const userInClause = `user_id.in.(${matchedUserIds.join(',')})`;
        query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%,${userInClause}`);
      } else {
        query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
      }
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: rows, count, error } = await query;
    if (error) throw error;

    const notifs = rows || [];
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Fetch user details for the returned notifications
    const userIds = Array.from(new Set(notifs.map((n: any) => n.user_id).filter(Boolean)));
    const userMap = new Map<string, any>();

    if (userIds.length > 0) {
      try {
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, name, email, phone, avatar_url, institute')
          .in('id', userIds);

        if (usersData) {
          usersData.forEach((u: any) => userMap.set(u.id, u));
        }
      } catch (usersFetchErr) {
        console.warn('Failed to fetch users map:', usersFetchErr);
      }
    }

    const items = notifs.map((n: any) => {
      const user = userMap.get(n.user_id) || null;
      return {
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        body: n.body || n.message || '',
        message: n.body || n.message || '',
        type: n.type || 'system',
        priority: n.priority || 'normal',
        is_read: n.is_read ?? false,
        data: n.data || null,
        created_at: n.created_at,
        user: user
          ? {
              id: user.id,
              name: user.name || 'Student',
              email: user.email || '',
              phone: user.phone || '',
              avatar_url: user.avatar_url || null,
              institute: user.institute || '',
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/notifications/history GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch notification history' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const { error } = await supabaseAdmin.from('notifications').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (err: any) {
    console.error('Error in /api/admin/notifications/history DELETE:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete notification' },
      { status: 500 },
    );
  }
}
