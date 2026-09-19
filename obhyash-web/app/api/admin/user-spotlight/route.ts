import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone, role, subscription, is_subscribed, subscription_status, status, created_at, exams_taken, xp')
      .or(`email.ilike.%${query}%,name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(8);

    if (error) throw error;

    const formattedData = (data || []).map((u: any) => ({
      ...u,
      plan: u.subscription?.plan?.toLowerCase() || (u.is_subscribed ? 'pro' : 'free'),
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'User search failed' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connection();
    const { userId, action, value } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or action' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    let updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (action === 'toggle_plan') {
      const isSub = value !== 'free';
      const planCap = value === 'pro' ? 'Pro' : value === 'premium' ? 'Premium' : 'Free';
      const expiry = isSub ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

      updateFields.is_subscribed = isSub;
      updateFields.subscription_status = isSub ? 'Active' : 'Inactive';
      updateFields.subscription = {
        plan: planCap,
        status: isSub ? 'Active' : 'Inactive',
        expiry,
      };
      updateFields.subscription_expires_at = expiry;
    } else if (action === 'toggle_role') {
      updateFields.role = value; // 'student' | 'teacher' | 'admin'
    } else if (action === 'toggle_status') {
      updateFields.status = value; // 'active' | 'banned'
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateFields)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `User ${action} applied successfully`,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update user' },
      { status: 500 },
    );
  }
}
