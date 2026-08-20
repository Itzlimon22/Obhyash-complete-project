import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch distinct/recent notifications history (latest 50)
    const [recentNotifsRes, totalCountRes, unreadCountRes, announcementsRes, systemRes, usersRes] =
      await Promise.all([
        supabaseAdmin
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false),
        supabaseAdmin
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'announcement'),
        supabaseAdmin
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'system'),
        supabaseAdmin
          .from('users')
          .select('id, name, email, phone')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

    const rawList = recentNotifsRes.data || [];

    // Group broadcast batches by (title + created_at minute) so admin sees 1 card per broadcast instead of 100 rows for 100 users
    const groupedMap = new Map<string, any>();
    for (const item of rawList) {
      const timeKey = item.created_at ? item.created_at.substring(0, 16) : '';
      const key = `${item.title}_${item.type}_${timeKey}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: item.id,
          title: item.title,
          message: item.message,
          type: item.type,
          priority: item.priority || 'normal',
          created_at: item.created_at,
          recipientCount: 1,
          sampleUserId: item.user_id,
        });
      } else {
        const existing = groupedMap.get(key);
        existing.recipientCount += 1;
      }
    }

    const broadcastHistory = Array.from(groupedMap.values()).slice(0, 20);

    const totalSent = totalCountRes.count || 0;
    const unread = unreadCountRes.count || 0;
    const readCount = Math.max(totalSent - unread, 0);
    const readRate = totalSent > 0 ? Math.round((readCount / totalSent) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        history: broadcastHistory,
        stats: {
          totalSent,
          unread,
          readCount,
          readRate,
          announcements: announcementsRes.count || 0,
          systemAlerts: systemRes.count || 0,
        },
        users: usersRes.data || [],
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/notifications GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch notifications data' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const { action, title, message, type = 'announcement', priority = 'normal', target = 'all', userIds = [] } = body;
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    if (action === 'broadcast') {
      if (!title || !message) {
        return NextResponse.json(
          { success: false, error: 'Title and message are required' },
          { status: 400 },
        );
      }

      let recipientIds: string[] = [];

      if (target === 'all') {
        const { data: allUsers, error: usersErr } = await supabaseAdmin
          .from('users')
          .select('id');

        if (usersErr) throw usersErr;
        recipientIds = (allUsers || []).map((u) => u.id);
      } else {
        recipientIds = Array.isArray(userIds) ? userIds : [userIds];
      }

      if (recipientIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No recipients found' },
          { status: 400 },
        );
      }

      const now = new Date().toISOString();
      const targetRoute = body.route || body.link || null;
      const notifications = recipientIds.map((uid) => ({
        user_id: uid,
        title,
        message,
        body: message,
        type,
        priority,
        link: targetRoute,
        data: targetRoute ? { route: targetRoute } : null,
        is_read: false,
        created_at: now,
      }));

      // Chunked batch insert (100 per chunk)
      const chunkSize = 100;
      let successCount = 0;

      for (let i = 0; i < notifications.length; i += chunkSize) {
        const chunk = notifications.slice(i, i + chunkSize);
        const { error: insertErr } = await supabaseAdmin
          .from('notifications')
          .insert(chunk);

        if (insertErr) {
          console.error('Batch insert error:', insertErr);
        } else {
          successCount += chunk.length;
        }
      }

      return NextResponse.json({
        success: true,
        count: successCount,
        message: `Notification broadcasted to ${successCount} recipients`,
      });
    }

    if (action === 'delete') {
      const { notificationId, title: delTitle, createdAt: delCreatedAt } = body;

      if (notificationId) {
        const { error: delErr } = await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('id', notificationId);

        if (delErr) throw delErr;
      } else if (delTitle) {
        let q = supabaseAdmin.from('notifications').delete().eq('title', delTitle);
        if (delCreatedAt) {
          const minPrefix = delCreatedAt.substring(0, 16);
          q = q.gte('created_at', `${minPrefix}:00Z`).lte('created_at', `${minPrefix}:59Z`);
        }
        const { error: delErr } = await q;
        if (delErr) throw delErr;
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 },
    );
  } catch (err: any) {
    console.error('Error in /api/admin/notifications POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process notification request' },
      { status: 500 },
    );
  }
}
