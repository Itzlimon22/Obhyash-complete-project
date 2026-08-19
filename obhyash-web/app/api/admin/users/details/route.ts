import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Service role key not configured on server' },
        { status: 500 },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ── Security Check: Verify Caller is Admin ──
    let isAdmin = false;

    // 1. Try Cookie Session
    try {
      const serverSupabase = await (await import('@/utils/supabase/server')).createClient();
      const { data: sessionUser } = await serverSupabase.auth.getUser();
      if (sessionUser?.user) {
        const { data: userRow } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', sessionUser.user.id)
          .single();

        if (userRow?.role === 'Admin') {
          isAdmin = true;
        }
      }
    } catch (_) {}

    // 2. Fallback to Bearer Token
    if (!isAdmin) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
          const { data: userRow } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', authData.user.id)
            .single();

          if (userRow?.role === 'Admin') {
            isAdmin = true;
          }
        }
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId')?.trim();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }

    // ── Fetch Full User Data in Parallel ──
    const [userRes, examsRes, paymentsRes, devicesRes, notesRes] = await Promise.all([
      supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle(),
      supabaseAdmin
        .from('exam_results')
        .select('id, subject, exam_type, score, total_marks, total_questions, correct_count, wrong_count, date, time_taken, created_at, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    // Map payments safely
    const payments = (paymentsRes.data || []).map((p: any) => ({
      id: p.id,
      plan_name: p.plan_name || 'Premium Plan',
      amount: Number(p.amount || 0),
      payment_method: p.payment_method || 'bKash',
      trx_id: p.transaction_id || p.trx_id || 'N/A',
      sender_number: p.sender_number || '',
      status: p.status || 'Pending',
      requested_at: p.requested_at || p.created_at || new Date().toISOString(),
    }));

    // Map exams safely
    const exams = (examsRes.data || []).map((e: any) => ({
      id: e.id,
      subject: e.subject || 'Practice Exam',
      score: Number(e.score || 0),
      total_marks: Number(e.total_marks || 0),
      correct_count: Number(e.correct_count || 0),
      wrong_count: Number(e.wrong_count || 0),
      date: e.date || e.created_at || new Date().toISOString(),
      time_taken: Number(e.time_taken || 0),
    }));

    // Map devices safely
    const devices = (devicesRes.data || []).map((d: any) => ({
      id: d.id,
      device_name: d.device_name || 'Active Session',
      device_type: d.device_type || 'web',
      ip_address: d.ip_address || 'Hidden',
      last_active: d.last_active || d.created_at || new Date().toISOString(),
    }));

    // Filter notes to relevant admin notes / support logs
    const notes = (notesRes.data || [])
      .filter((n: any) => {
        const type = (n.activity_type || n.action_type || '').toUpperCase();
        return type.includes('NOTE') || type.includes('ADMIN') || type.includes('SUPPORT');
      })
      .map((n: any) => ({
        id: n.id,
        description: n.description || n.details || '',
        created_at: n.created_at || new Date().toISOString(),
        metadata: n.metadata || {},
      }));

    return NextResponse.json({
      success: true,
      data: {
        user: userRes.data || null,
        exams,
        payments,
        devices,
        notes,
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin user details:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
