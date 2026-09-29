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

    let query = supabaseAdmin
      .from('login_support_requests')
      .select('*', { count: 'exact' });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(
        `name.ilike.%${s}%,contact_info.ilike.%${s}%,issue_type.ilike.%${s}%,description.ilike.%${s}%`,
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order('created_at', { ascending: false }).range(from, to);

    const [
      ticketsRes,
      totalRes,
      pendingRes,
      inProgressRes,
      resolvedRes,
      dismissedRes,
    ] = await Promise.all([
      query,
      supabaseAdmin.from('login_support_requests').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('login_support_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending'),
      supabaseAdmin
        .from('login_support_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'In Progress'),
      supabaseAdmin
        .from('login_support_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Resolved'),
      supabaseAdmin
        .from('login_support_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Dismissed'),
    ]);

    if (ticketsRes.error) {
      console.error('Error fetching support tickets:', ticketsRes.error);
      throw ticketsRes.error;
    }

    return NextResponse.json({
      success: true,
      data: ticketsRes.data || [],
      pagination: {
        page,
        pageSize,
        total: ticketsRes.count ?? 0,
        totalPages: Math.ceil((ticketsRes.count ?? 0) / pageSize),
      },
      stats: {
        total: totalRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        inProgress: inProgressRes.count ?? 0,
        resolved: resolvedRes.count ?? 0,
        dismissed: dismissedRes.count ?? 0,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in GET /api/admin/support-tickets:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ticket ID is required' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (status) updatePayload.status = status;
    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;

    const { error } = await supabaseAdmin
      .from('login_support_requests')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('Error updating support ticket:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Support ticket updated successfully',
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
