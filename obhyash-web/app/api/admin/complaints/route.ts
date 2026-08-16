import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // Build base query
    let query = supabaseAdmin.from('app_complaints').select('*', { count: 'exact' });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(
        `description.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`,
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order('created_at', { ascending: false }).range(from, to);

    // Fetch complaints and status counts in parallel
    const [
      complaintsRes,
      totalRes,
      pendingRes,
      inProgressRes,
      resolvedRes,
      dismissedRes,
    ] = await Promise.all([
      query,
      supabaseAdmin.from('app_complaints').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('app_complaints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending'),
      supabaseAdmin
        .from('app_complaints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'In Progress'),
      supabaseAdmin
        .from('app_complaints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Resolved'),
      supabaseAdmin
        .from('app_complaints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Dismissed'),
    ]);

    if (complaintsRes.error) {
      console.error('Error fetching complaints:', complaintsRes.error);
      throw complaintsRes.error;
    }

    const rawComplaints = complaintsRes.data || [];
    const totalCount = complaintsRes.count || 0;

    // Fetch user info for each complaint
    const userIds = Array.from(
      new Set(rawComplaints.map((c) => c.user_id).filter(Boolean)),
    );

    let userMap = new Map();
    if (userIds.length > 0) {
      const { data: usersData } = await supabaseAdmin
        .from('users')
        .select('id, name, email, phone')
        .in('id', userIds);

      if (usersData) {
        userMap = new Map(usersData.map((u: any) => [u.id, u]));
      }
    }

    const mappedComplaints = rawComplaints.map((c) => ({
      ...c,
      user: userMap.get(c.user_id) || {
        name: 'Student',
        email: '',
        phone: '',
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        complaints: mappedComplaints,
        count: totalCount,
        stats: {
          total: totalRes.count || 0,
          pending: pendingRes.count || 0,
          inProgress: inProgressRes.count || 0,
          resolved: resolvedRes.count || 0,
          dismissed: dismissedRes.count || 0,
        },
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/complaints GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch complaints' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const { action, complaintId, feedback, status = 'Resolved' } = body;
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    if (action === 'resolve' || action === 'update_status') {
      if (!complaintId) {
        return NextResponse.json(
          { success: false, error: 'complaintId is required' },
          { status: 400 },
        );
      }

      const now = new Date();

      // Fetch complaint
      const { data: complaintData, error: fetchErr } = await supabaseAdmin
        .from('app_complaints')
        .select('*')
        .eq('id', complaintId)
        .single();

      if (fetchErr || !complaintData) {
        return NextResponse.json(
          { success: false, error: 'Complaint not found' },
          { status: 404 },
        );
      }

      const updatePayload: Record<string, any> = {
        status,
        updated_at: now.toISOString(),
      };
      if (feedback !== undefined) {
        updatePayload.admin_feedback = feedback;
      }

      const { error: updateErr } = await supabaseAdmin
        .from('app_complaints')
        .update(updatePayload)
        .eq('id', complaintId);

      if (updateErr) throw updateErr;

      // Send user notification if user_id exists
      if (complaintData.user_id) {
        try {
          const typeStatusBn: Record<string, string> = {
            'Resolved': 'সমাধান করা হয়েছে',
            'In Progress': 'পর্যালোচনাধীন রয়েছে',
            'Dismissed': 'খারিজ করা হয়েছে',
            'Pending': 'অপেক্ষমান',
          };

          const statusBn = typeStatusBn[status] || status;

          await supabaseAdmin.from('notifications').insert({
            user_id: complaintData.user_id,
            title: `অভিযোগ আপডেট: ${statusBn}`,
            message: feedback
              ? `আপনার পাঠানো অভিযোগটির বিষয়ে অ্যাডমিন মন্তব্য: "${feedback}"`
              : `আপনার পাঠানো অভিযোগটি (${statusBn}) হয়েছে।`,
            type: status === 'Resolved' ? 'success' : 'info',
            read: false,
            created_at: now.toISOString(),
          });
        } catch (notifErr) {
          console.warn('Failed to send notification for complaint:', notifErr);
        }
      }

      return NextResponse.json({ success: true, status });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action specified' },
      { status: 400 },
    );
  } catch (err: any) {
    console.error('Error in /api/admin/complaints POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update complaint' },
      { status: 500 },
    );
  }
}
