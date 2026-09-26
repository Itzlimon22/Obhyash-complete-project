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
  } catch (error: any) {
    console.error('Error fetching admin blog subscribers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// Delete a subscriber
export async function DELETE(request: NextRequest) {
  try {
    await connection();

    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Target ID required' },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Subscriber removed successfully',
    });
  } catch (error: any) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete subscriber' },
      { status: 500 },
    );
  }
}
