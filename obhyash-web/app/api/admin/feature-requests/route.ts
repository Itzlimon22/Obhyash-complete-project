import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(
      1,
      parseInt(searchParams.get('pageSize') || '20'),
    );
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    let query = supabaseAdmin
      .from('app_feature_requests')
      .select('*', { count: 'exact' });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Match user by name or email
      const { data: matchedUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);

      const matchedUserIds = (matchedUsers || []).map((u: any) => u.id);

      if (matchedUserIds.length > 0) {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,user_id.in.(${matchedUserIds.join(',')})`,
        );
      } else {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`,
        );
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order('created_at', { ascending: false }).range(from, to);

    // Parallel fetch for stats
    const [
      requestsRes,
      totalRes,
      underReviewRes,
      plannedRes,
      inProgressRes,
      completedRes,
      declinedRes,
    ] = await Promise.all([
      query,
      supabaseAdmin
        .from('app_feature_requests')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('app_feature_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Under Review'),
      supabaseAdmin
        .from('app_feature_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Planned'),
      supabaseAdmin
        .from('app_feature_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'In Progress'),
      supabaseAdmin
        .from('app_feature_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Completed'),
      supabaseAdmin
        .from('app_feature_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Declined'),
    ]);

    if (requestsRes.error) {
      console.error('Error fetching feature requests:', requestsRes.error);
      throw requestsRes.error;
    }

    const rawRequests = requestsRes.data || [];
    const totalCount = requestsRes.count || 0;

    // Fetch user info for each request
    const userIds = Array.from(
      new Set(rawRequests.map((r) => r.user_id).filter(Boolean)),
    );

    let userMap = new Map();
    if (userIds.length > 0) {
      const { data: usersData } = await supabaseAdmin
        .from('users')
        .select('id, name, email, phone, avatar_url, avatar_color')
        .in('id', userIds);

      if (usersData) {
        userMap = new Map(usersData.map((u: any) => [u.id, u]));
      }
    }

    const mappedRequests = rawRequests.map((r) => ({
      ...r,
      user: userMap.get(r.user_id) || {
        name: 'Student',
        email: '',
        phone: '',
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        featureRequests: mappedRequests,
        count: totalCount,
        stats: {
          total: totalRes.count || 0,
          underReview: underReviewRes.count || 0,
          planned: plannedRes.count || 0,
          inProgress: inProgressRes.count || 0,
          completed: completedRes.count || 0,
          declined: declinedRes.count || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Admin feature requests GET API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const { action, requestId, status, feedback } = body;

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    if (action === 'updateStatus') {
      if (!requestId || !status) {
        return NextResponse.json(
          { success: false, error: 'Missing requestId or status' },
          { status: 400 },
        );
      }

      const updatePayload: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (feedback !== undefined) {
        updatePayload.admin_feedback = feedback;
      }

      const { error } = await supabaseAdmin
        .from('app_feature_requests')
        .update(updatePayload)
        .eq('id', requestId);

      if (error) throw error;

      // Send notification to user
      const { data: requestData } = await supabaseAdmin
        .from('app_feature_requests')
        .select('user_id, title')
        .eq('id', requestId)
        .single();

      if (requestData?.user_id) {
        try {
          const statusBnMap: Record<string, string> = {
            'Under Review': 'বিবেচনাধীন রয়েছে',
            'Planned': 'রোডম্যাপে যুক্ত করা হয়েছে',
            'In Progress': 'কাজ চলছে',
            'Completed': 'যুক্ত করা হয়েছে! 🎉',
            'Declined': 'স্থগিত রাখা হয়েছে',
          };
          const statusBn = statusBnMap[status] || status;
          await supabaseAdmin.from('notifications').insert({
            user_id: requestData.user_id,
            title: `ফিচার প্রস্তাবনা আপডেট: ${statusBn}`,
            message: feedback
              ? `আপনার প্রস্তাব "${requestData.title}" বিষয়ে অ্যাডমিন মন্তব্য: "${feedback}"`
              : `আপনার প্রস্তাব "${requestData.title}" এর স্ট্যাটাস আপডেট: ${statusBn}`,
            type: status === 'Completed' ? 'success' : 'info',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        } catch (notifErr) {
          console.warn('Failed to send notification for feature request:', notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Feature request updated successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('Admin feature requests POST API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
